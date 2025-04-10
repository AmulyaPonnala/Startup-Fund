import pandas as pd
import joblib
import numpy as np
from sklearn.metrics import ndcg_score
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 🔹 1. Load model and encoders
try:
    model = joblib.load("xgb_startup_investor_ranker.model")
    label_encoders = joblib.load("label_encoders.pkl")
    logger.info("Model and encoders loaded successfully")
except Exception as e:
    logger.error(f"Error loading model files: {str(e)}")
    raise

# 🔹 2. Load investor dataset
try:
    investors_df = pd.read_csv("startup_investor_ranker_training_data1.csv", dtype=str)
    logger.info("Investor data loaded successfully")
except Exception as e:
    logger.error(f"Error loading investor data: {str(e)}")
    raise

# 🔹 3. Clean numeric columns
def clean_numeric(df, col):
    return df[col].str.replace(r"[^0-9.]", "", regex=True).replace("", "0").astype(float)

for col in ["Funding Required", "Check Size", "Success Rate"]:
    investors_df[col] = clean_numeric(investors_df, col)

# Ensure string columns are safe
investors_df["Investor Stage"] = investors_df["Investor Stage"].fillna("").astype(str)
investors_df["Investor Industry"] = investors_df["Investor Industry"].fillna("").astype(str)
investors_df["Firm"] = investors_df["Firm"].fillna("").astype(str)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get JSON data
        startup_input = request.get_json()
        logger.debug(f"Received input: {startup_input}")
        
        # Validate required fields
        required_fields = ["Funding Required", "Industry", "Stage"]
        for field in required_fields:
            if field not in startup_input:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        startup_funding = float(startup_input["Funding Required"])

        # 🔹 5. Filter by Industry
        filtered_df = investors_df[
            investors_df["Investor Industry"].str.contains(
                startup_input["Industry"], case=False, na=False
            )
        ].copy()
        logger.debug(f"Filtered by industry, rows: {len(filtered_df)}")

        # Check stage matches
        stage_matched_df = filtered_df[
            filtered_df["Investor Stage"].str.strip().str.lower() == startup_input["Stage"].strip().lower()
        ]
        logger.debug(f"Stage matched rows: {len(stage_matched_df)}")
        
        # Fallback if too few matches
        if len(filtered_df) < 0.01 * len(investors_df):
            filtered_df = investors_df.copy()
            logger.warning("Too few matches, using full dataset")

        # 🔹 6. Prepare prediction data
        prediction_df = filtered_df.copy()
        prediction_df["Firm_ID"] = prediction_df["Firm"]
        prediction_df["Industry"] = startup_input["Industry"]
        prediction_df["Stage"] = startup_input["Stage"]
        prediction_df["Funding Required"] = startup_input["Funding Required"]

        # 🔹 7. Encode categorical columns
        for col in ["Industry", "Stage", "Investor Industry", "Investor Stage", "Firm"]:
            le = label_encoders[col]
            fallback = le.classes_[0]
            prediction_df[col] = prediction_df[col].fillna(fallback).astype(str)
            prediction_df[col] = prediction_df[col].apply(
                lambda x: x if x in le.classes_ else fallback
            )
            prediction_df[col] = le.transform(prediction_df[col])
            logger.debug(f"Encoded column: {col}")

        # 🔹 8. Clean Funding Required
        prediction_df["Funding Required"] = clean_numeric(prediction_df, "Funding Required")

        # 🔹 9. Predict base score
        features = [
            "Industry", "Stage", "Funding Required",
            "Investor Industry", "Investor Stage", "Check Size", "Success Rate", "Firm"
        ]
        prediction_df["base_score"] = model.predict(prediction_df[features])
        logger.debug("Base scores predicted")

        # 🔹 10. Add Stage Match Boost
        prediction_df["stage_match"] = (
            filtered_df["Investor Stage"].str.strip().str.lower() == startup_input["Stage"].strip().lower()
        ).astype(int)
        logger.debug("Stage match calculated")

        # 🔹 11. Add Check Size Proximity Score
        prediction_df["check_proximity"] = 1 / (1 + abs(prediction_df["Check Size"] - startup_funding))

        # 🔹 12. Weighted Scoring
        w_base = 0.6
        w_stage = 0.25
        w_check = 0.15

        prediction_df["final_score"] = (
            w_base * prediction_df["base_score"] +
            w_stage * prediction_df["stage_match"] +
            w_check * prediction_df["check_proximity"]
        )
        logger.debug("Final scores computed")

        # 🔹 13. Merge original info
        final_df = prediction_df.merge(
            investors_df[[
                "Firm", "Investor Name", "Investor Stage", "Investor Industry",
                "Check Size", "Previous Investments", "Success Rate", "Relevance"
            ]].drop_duplicates(subset=["Firm"]),
            left_on="Firm_ID", right_on="Firm", how="left", suffixes=("_encoded", "")
        )
        logger.debug(f"Merged dataframe, rows: {len(final_df)}")

        # 🔹 14. Extract readable columns (adjusted for merge suffixes)
        columns_to_use = [
            "Investor Name", "Investor Stage", "Investor Industry",
            "Check Size", "Previous Investments", "Success Rate", "Relevance"
        ]

        # 🔹 15. Decode label-encoded values safely
        inv_stage_le = label_encoders["Investor Stage"]
        inv_industry_le = label_encoders["Investor Industry"]

        def safe_decode(value, le, fallback="Unknown"):
            try:
                if pd.notnull(value) and value != "":
                    return le.inverse_transform([int(value)])[0]
                return fallback
            except Exception as e:
                logger.warning(f"Decode error for {value}: {str(e)}")
                return fallback

        # Decode the encoded columns, not the original strings
        final_df["Investor Stage_decoded"] = final_df["Investor Stage_encoded"].apply(
            lambda x: safe_decode(x, inv_stage_le)
        )
        final_df["Investor Industry_decoded"] = final_df["Investor Industry_encoded"].apply(
            lambda x: safe_decode(x, inv_industry_le)
        )
        logger.debug("Columns decoded")

        # 🔹 16. Get Top 10 Unique Investors with decoded and original columns
        output_columns = [
            "Investor Name", "Investor Stage_decoded", "Investor Industry_decoded",
            "Check Size", "Previous Investments", "Success Rate", "Relevance", "final_score"
        ]
        top_10 = final_df[output_columns].drop_duplicates(subset=["Investor Name"]).dropna(
            subset=["Investor Name"]
        ).sort_values(by="final_score", ascending=False).head(10)

        # 🔹 17. Clean output
        top_10 = top_10.rename(columns={
            "Investor Name": "Investor Name",
            "Investor Stage_decoded": "Investor Stage",
            "Investor Industry_decoded": "Investor Industry",
            "Check Size": "Check Size",
            "Previous Investments": "Previous Investments",
            "Success Rate": "Success Rate",
            "Relevance": "Relevance",
            "final_score": "Score"
        })

        # NDCG score calculation
        valid_indices = final_df.index.intersection(investors_df.index)
        true_relevance = investors_df.loc[valid_indices, "Relevance"].astype(float).values
        predicted_scores = final_df.loc[valid_indices, "final_score"].values
        ndcg = ndcg_score([true_relevance], [predicted_scores], k=10) if len(true_relevance) > 0 else 0.0

        # Prepare JSON response
        result = top_10.to_dict(orient='records')
        
        # Convert numpy types to native Python types
        for investor in result:
            for key, value in investor.items():
                if isinstance(value, (np.integer, np.floating)):
                    investor[key] = int(value) if isinstance(value, np.integer) else float(value)
                elif pd.isna(value):
                    investor[key] = None

        logger.info("Prediction completed successfully")
        return jsonify({
            "investors": result,
            "ndcg": float(ndcg),
            "status": "success"
        })

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)