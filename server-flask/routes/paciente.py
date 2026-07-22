from flask import Blueprint 
from flask import request 
from flask import jsonify
from models.paciente import db, Paciente

paciente_bp = Blueprint('paciente', __name__)

@paciente_bp.route('/')
def hello_world():
    return 'Hello world'

@paciente_bp.route('/api/patient', methods=['POST'])
def create_patient():
    data = request.get_json()
    try:
        paciente = Paciente(name=data['name'], email=data['email'], password=data['password'])
        db.session.add(paciente)
        db.session.commit()
        return {'message' : 'Paciente creado'},201
    except Exception as e:
        db.session.rollback()
        return{'error': str(e)}, 400

@paciente_bp.route('/api/patient')
def get_patients():
    pacientes = Paciente.query.all()
    return jsonify([{'id': p.id, 'name': p.name} for p in pacientes])


@paciente_bp.route('/api/fruits')
def get_fruits():
    return ['Apple', 'Banana', 'Cherry']