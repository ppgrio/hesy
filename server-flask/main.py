from flask import Flask
from flask_cors import CORS
from models.paciente import db, Paciente
from routes.paciente import paciente_bp

app = Flask(__name__)
CORS(app)
app.config.from_object('config')
db.init_app(app)

app.register_blueprint(paciente_bp)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True) #by default, Flask runs on port 5000
