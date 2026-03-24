from deepface import DeepFace
import numpy as np

def generate_face_embedding(image_path: str):
    """
    Uses ArcFace to turn a photo into a 512-dimensional list of numbers.
    """
    try:
        # 'represent' extracts the mathematical features
        results = DeepFace.represent(
            img_path = image_path,
            model_name = "ArcFace",
            detector_backend = "retinaface", # High accuracy for mobile
            enforce_detection = True
        )
        
        # Only care about the first face found in the photo
        return results[0]["embedding"]
        
    except ValueError:
        print("❌ No face detected in the image.")
        return None
    except Exception as e:
        print(f"⚠️ AI Processing Error: {e}")
        return None