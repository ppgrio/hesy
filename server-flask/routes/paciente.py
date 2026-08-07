from flask import Blueprint, request, jsonify
from models.init import db
from models.pacientes import Pacientes
from models.doctores import Doctores
from models.accesos import Accesos
from models.filtros import Filtros
from sqlalchemy.orm import joinedload

paciente_bp = Blueprint('paciente', __name__)

@paciente_bp.route('/api/patient', methods=['GET'])
def get_patients():
    pacientes = Pacientes.query.options(
        joinedload(Pacientes.doctor),
        joinedload(Pacientes.acceso),
        joinedload(Pacientes.filtro),
    ).all()
    result = []
    for p in pacientes:
        result.append({
            'no_expediente': p.no_expediente,
            'nombre': p.nombre,
            'fecha_nacimiento': p.fecha_nacimiento.isoformat() if p.fecha_nacimiento else None,
            'hierros': p.hierros,
            'eritropoyetina': p.eritropoyetina,
            'observaciones': p.observaciones,
            'fecha_inicio_filtro': p.fecha_inicio_filtro.isoformat() if p.fecha_inicio_filtro else None,
            'fecha_fin_filtro': p.fecha_fin_filtro.isoformat() if p.fecha_fin_filtro else None,
            'doctor': p.doctor.nombre if p.doctor else None,
            'acceso': p.acceso.tipo if p.acceso else None,
            'filtro': p.filtro.estado if p.filtro else None,
        })
    return jsonify(result)

@paciente_bp.route('/api/filtros', methods=['GET'])
def get_filtros():
    filtros = Filtros.query.order_by(Filtros.id).all()
    return jsonify([f.estado for f in filtros])

@paciente_bp.route('/api/accesos', methods=['GET'])
def get_accesos():
    accesos = Accesos.query.order_by(Accesos.id).all()
    return jsonify([a.tipo for a in accesos])