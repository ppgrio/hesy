from models.init import db

class Sesiones(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('pacientes.no_expediente'))
    fecha_hora = db.Column(db.DateTime, nullable = False, index = True)
    filtro_sesion = db.Column(db.Integer, db.ForeignKey('filtros.id'))
    acceso_sesion = db.Column(db.Integer, db.ForeignKey('accesos.id'))

    paciente = db.relationship('Pacientes', backref = 'sesiones')
    filtro = db.relationship('Filtros')
    acceso = db.relationship('Accesos')