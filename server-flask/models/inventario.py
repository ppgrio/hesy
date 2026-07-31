from models.init import db

class Inventario(db.Model):
    __table_args__ = (
        db.CheckConstraint('cantidad >= 0', name='stock_no_negativo'),
    )
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(30), nullable=False, unique = True)
    cantidad = db.Column(db.Integer, nullable = False)
    caducidad = db.Column(db.Date)
    area_id = db.Column(db.Integer, db.ForeignKey('areas.id'))

    area = db.relationship('Areas', backref = 'inventario')