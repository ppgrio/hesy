from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask import request
from flask import jsonify

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db' #directorio
db = SQLAlchemy(app)

class Paciente(db.Model):
    id = db.Column(db.Integer , primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

with app.app_context():
    db.create_all()

@app.route('/')
def hello_world():
    return 'Hello world'

@app.route('/api/patient', methods=['POST'])
def create_patient():
    data = request.get_json()
    paciente = Paciente(name=data['name'], email=data['email'], password=data['password'])
    db.session.add(paciente)
    db.session.commit()
    return {'message' : 'Paciente creado'},201

@app.route('/api/patient')
def get_patients():
    pacientes = Paciente.query.all()
    return jsonify([{'id': p.id, 'name': p.name} for p in pacientes])


@app.route('/api/fruits')
def get_fruits():
    return ['Apple', 'Banana', 'Cherry']

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True) #by default, Flask runs on port 5000
