from flask import Blueprint, jsonify, request
from models.init import db
from models.pagos import Pagos
from models.sesiones import Sesiones

pagos_bp = Blueprint('pagos', __name__)


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
