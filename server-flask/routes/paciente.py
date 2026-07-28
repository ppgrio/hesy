from flask import Blueprint 
from flask import request 
from flask import jsonify
from models.init import db
from models.pacientes import Pacientes

paciente_bp = Blueprint('paciente', __name__)

@paciente_bp.route('/')
def hello_world():
    return 'Hello world'

@paciente_bp.route('/api/patient', methods=['POST'])
def create_patient():
    data = request.get_json()
    try:
        paciente = Pacientes(name=data['name'], email=data['email'], password=data['password'])
        db.session.add(paciente)
        db.session.commit()
        return {'message' : 'Paciente creado'},201
    except Exception as e:
        db.session.rollback()
        return{'error': str(e)}, 400

@paciente_bp.route('/api/patient')
def get_patients():
    pacientes = Pacientes.query.all()
    return jsonify([{'id': p.id, 'name': p.nombre} for p in pacientes])