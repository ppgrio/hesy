from flask import Blueprint, jsonify, request
from models.init import db
from models.pagos import Pagos
from models.sesiones import Sesiones
from models.metodo_pago import MetodoPago
from sqlalchemy.orm import joinedload

pagos_bp = Blueprint('pagos', __name__)


def pago_to_dict(p):
    return {
        'id': p.id,
        'sesion_id': p.sesion_id,
        'monto': p.monto,
        'metodo_pago_id': p.metodo_pago_id,
    }


def registrar_abonos(sesion_id, abonos):
    total_abonos = 0.0
    for abono in abonos:
        monto = abono.get('monto')
        metodo_pago_id = abono.get('metodo_pago_id')
        try:
            monto = float(monto)
        except (TypeError, ValueError):
            raise ValueError('Cada abono debe tener un monto numérico')
        if monto <= 0:
            raise ValueError('El monto de cada abono debe ser mayor a 0')
        if metodo_pago_id is not None and not MetodoPago.query.get(metodo_pago_id):
            raise ValueError('Método de pago no válido')
        db.session.add(Pagos(
            sesion_id=sesion_id,
            monto=monto,
            metodo_pago_id=metodo_pago_id,
        ))
        total_abonos += monto
    return total_abonos


@pagos_bp.route('/api/session/<int:sesion_id>/pagos')
def get_pagos_sesion(sesion_id):
    Sesiones.query.get_or_404(sesion_id)
    pagos = Pagos.query.options(
        db.joinedload(Pagos.metodo_pago)
    ).filter_by(sesion_id=sesion_id).all()
    return jsonify([{
        'id': p.id,
        'monto': p.monto,
        'metodo_pago_id': p.metodo_pago_id,
        'metodo': p.metodo_pago.nombre if p.metodo_pago else None,
    } for p in pagos])


@pagos_bp.route('/api/session/<int:sesion_id>/abonos', methods=['POST'])
def registrar_abonos_sesion(sesion_id):
    sesion = Sesiones.query.get_or_404(sesion_id)
    data = request.get_json(silent=True) or {}
    abonos = data.get('abonos') or []

    if not abonos:
        return jsonify({'error': 'No hay abonos para registrar'}), 400

    try:
        total = registrar_abonos(sesion_id, abonos)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if sesion.paciente:
        sesion.paciente.credito = (sesion.paciente.credito or 0) + total

    db.session.commit()
    return jsonify({'monto_abonado': total, 'credito': sesion.paciente.credito if sesion.paciente else None}), 201


@pagos_bp.route('/api/pagos', methods=['POST'])
def create_pago():
    data = request.get_json()

    sesion_id = data.get('sesion_id')
    monto = data.get('monto')
    metodo_pago_id = data.get('metodo_pago_id')

    if not sesion_id:
        return jsonify({'error': 'sesion_id es obligatorio'}), 400
    if monto is None:
        return jsonify({'error': 'monto es obligatorio'}), 400
    try:
        monto = float(monto)
    except (TypeError, ValueError):
        return jsonify({'error': 'monto debe ser un número'}), 400

    sesion = Sesiones.query.get(sesion_id)
    if not sesion:
        return jsonify({'error': 'Sesión no encontrada'}), 404

    pago = Pagos(
        sesion_id=sesion_id,
        monto=monto,
        metodo_pago_id=metodo_pago_id,
    )
    db.session.add(pago)

    if sesion.paciente:
        sesion.paciente.credito = (sesion.paciente.credito or 0) + monto

    db.session.commit()
    return jsonify({
        'id': pago.id,
        'sesion_id': pago.sesion_id,
        'monto': pago.monto,
        'metodo_pago_id': pago.metodo_pago_id,
    }), 201
