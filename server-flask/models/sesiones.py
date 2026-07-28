from models.init import db

class Sesiones(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('pacientes.no_expediente'))

    paciente = db.relationship('Pacientes', backref = 'sesiones')