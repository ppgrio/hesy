from flask import Blueprint, jsonify
from models.init import db
from models.sesiones import Sesiones

sesion_bp = Blueprint('sesion', __name__)

@sesion_bp.route('/api/session')
def get_sessions():
    sesiones = Sesiones.query.all()
    return jsonify([{
        'id': s.id,
        'paciente_nombre': s.paciente.nombre if s.paciente else None,
        'fecha_hora': s.fecha_hora.isoformat() if s.fecha_hora else None,
    } for s in sesiones])
