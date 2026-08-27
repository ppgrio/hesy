from models.init import db

class Inventario(db.Model):
    __table_args__ = (
        db.CheckConstraint('cantidad >= 0', name='stock_no_negativo'),
    )
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.Integer, unique=True, nullable=True)
    nombre = db.Column(db.String(100), nullable=False)
    cantidad = db.Column(db.Integer, nullable = False)
    precio = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    caducidad = db.Column(db.Date)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'))

    area = db.relationship('Areas', backref = 'inventario')