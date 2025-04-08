import os
import logging
from flask import Flask, render_template, request, jsonify, send_file
import uuid
import tempfile
from werkzeug.utils import secure_filename
from utils.image_processing import convert_to_sketch

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
TEMP_FOLDER = tempfile.gettempdir()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        unique_filename = str(uuid.uuid4())
        original_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()

        input_path = os.path.join(TEMP_FOLDER, f"{unique_filename}.{original_ext}")
        file.save(input_path)

        contrast = float(request.form.get('contrast', 1.0))
        brightness = float(request.form.get('brightness', 0))

        try:
            output_path = os.path.join(TEMP_FOLDER, f"{unique_filename}_sketch.png")
            convert_to_sketch(input_path, output_path, contrast, brightness)

            return jsonify({
                'success': True,
                'message': 'Image converted successfully!',
                'filename': f"{unique_filename}_sketch.png"
            })
        except Exception as e:
            logger.error(f"Error during image conversion: {str(e)}")
            return jsonify({'error': f'Error during conversion: {str(e)}'}), 500
        finally:
            if os.path.exists(input_path):
                os.remove(input_path)

    return jsonify({'error': 'Invalid file format. Only PNG and JPG are allowed.'}), 400

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        file_path = os.path.join(TEMP_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        return send_file(file_path, as_attachment=True, download_name="pencil_sketch.png")
    except Exception as e:
        logger.error(f"Error during file download: {str(e)}")
        return jsonify({'error': f'Error during download: {str(e)}'}), 500
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)