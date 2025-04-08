import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

def convert_to_sketch(input_path, output_path, contrast=1.0, brightness=0):
    try:
        logger.debug(f"Reading image from {input_path}")
        img = cv2.imread(input_path)

        if img is None:
            logger.error(f"Could not read image at {input_path}")
            return False

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.convertScaleAbs(gray, alpha=contrast, beta=brightness)
        inverted = 255 - gray
        blurred = cv2.GaussianBlur(inverted, (21, 21), 0)
        inverted_blurred = 255 - blurred
        sketch = cv2.divide(gray, inverted_blurred, scale=256.0)

        logger.debug(f"Saving sketch to {output_path}")
        cv2.imwrite(output_path, sketch)

        return True

    except Exception as e:
        logger.error(f"Error in convert_to_sketch: {str(e)}")
        raise