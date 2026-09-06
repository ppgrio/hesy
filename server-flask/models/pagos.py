from models.init import db

class Pagos(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sesion_id = db.Column(db.Integer, db.ForeignKey('sesiones.id'), nullable=False)
    monto = db.Column(db.Float, nullable=False)
    metodo_pago_id = db.Column(db.Integer, db.ForeignKey('metodo_pago.id'))

    sesion = db.relationship('Sesiones', backref='pagos')
    metodo_pago = db.relationship('MetodoPago')
