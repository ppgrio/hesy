from models.init import db

class MedicamentosSesion(db.Model):
    __table_args__ = (
        db.CheckConstraint('cantidad_usada > 0', name='cantidad_positiva'),
    )
    id = db.Column(db.Integer, primary_key=True)
    sesion_id = db.Column(db.Integer, db.ForeignKey('sesiones.id'), nullable=False)
    inventario_id = db.Column(db.Integer, db.ForeignKey('inventario.id'), nullable=False)
    cantidad_usada = db.Column(db.Integer, nullable=False)

    sesion = db.relationship('Sesiones', backref='medicamentos_usados')
    inventario_item = db.relationship('Inventario', backref='usos_en_sesiones')
