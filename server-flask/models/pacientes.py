from models.init import db

class Pacientes(db.Model):
    no_expediente = db.Column(db.Integer , primary_key=True)
    nombre = db.Column(db.String(60), nullable=False, index=True)
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    hierros = db.Column(db.Integer)
    eritropoyetina = db.Column(db.Integer)
    acceso_id = db.Column(db.Integer, db.ForeignKey('accesos.id'))
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctores.id'))
    observaciones = db.Column(db.String(20))
    
    #filtros
    filtro_id = db.Column(db.Integer, db.ForeignKey('filtros.id'))
    fecha_inicio_filtro = db.Column(db.Date)
    fecha_fin_filtro = db.Column(db.Date)

    #relaciones
    doctor = db.relationship('Doctores', backref = 'pacientes')
    acceso = db.relationship('Accesos', backref = 'pacientes')
    filtro = db.relationship('Filtros', backref = 'pacientes')