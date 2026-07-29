import random
from datetime import datetime, date, timedelta, time
from flask import Flask
from flask_cors import CORS
from models.init import db
from models.pacientes import Pacientes
from models.doctores import Doctores
from models.accesos import Accesos
from models.filtros import Filtros
from models.sesiones import Sesiones
from models.areas import Areas
from models.inventario import Inventario

app = Flask(__name__)
CORS(app)
app.config.from_object('config')
db.init_app(app)

nombres = [
    'Juan', 'María', 'Carlos', 'Ana', 'José', 'Laura', 'Miguel', 'Sofía',
    'Pedro', 'Elena', 'Luis', 'Carmen', 'Jorge', 'Rosa', 'Alberto', 'Isabel',
    'Rafael', 'Patricia', 'Antonio', 'Marta', 'Diego', 'Lucía', 'Manuel',
    'Cristina', 'Francisco', 'Mónica', 'Javier', 'Silvia', 'Ángel', 'Teresa',
    'David', 'Raquel', 'Pablo', 'Natalia', 'Sergio', 'Sara', 'Raúl', 'Eva',
    'Fernando', 'Claudia', 'Héctor', 'Daniela', 'Óscar', 'Julia', 'Víctor',
    'Lorena', 'Rubén', 'Paula', 'Adrián', 'Andrea', 'Hugo', 'Valeria',
    'Martín', 'Camila', 'Santiago', 'Gabriela', 'Mateo', 'Mariana', 'Lucas',
]

apellidos = [
    'García', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'González',
    'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Morales',
    'Ortiz', 'Vázquez', 'Cruz', 'Reyes', 'Gutiérrez', 'Mendoza', 'Molina',
    'Rojas', 'Castillo', 'Romero', 'Moreno', 'Álvarez', 'Delgado', 'Castro',
    'Vargas', 'Herrera', 'Medina', 'Aguilar', 'Garza', 'Fernández', 'Chávez',
    'Ruiz', 'Díaz', 'Jiménez', 'Navarro', 'Domínguez', 'Velázquez',
]

doctores_nombres = [
    'Dr. Reyes', 'Dra. Canseco', 'Dr. Ricardo Cabrera',
]

accesos_tipos = ['FAV', 'MHK', 'PMCAT']

filtros_estados = ['Nuevo', 'Reuso', 'Desechable']

areas_nombres = ['Bodega', 'Carrito rojo', 'Administracion']

inventario_items = [
    ('Heparina', 5000, 120),
    ('Suero Fisiológico 500ml', 10000, 90),
    ('Suero Fisiológico 1000ml', 8000, 90),
    ('Agua Estéril 500ml', 6000, 180),
    ('Bicarbonato 100ml', 3000, 60),
    ('Dializador FX80', 200, 730),
    ('Dializador FX100', 150, 730),
    ('Línea Arterial', 500, 730),
    ('Línea Venosa', 500, 730),
    ('Fístula Aguja 15G', 1000, 365),
    ('Fístula Aguja 16G', 1000, 365),
    ('Jeringa 5ml', 2000, 730),
    ('Jeringa 10ml', 1500, 730),
    ('Gasas Estériles 10x10', 5000, 365),
    ('Guantes Estériles #7', 800, 730),
    ('Guantes Estériles #7.5', 800, 730),
    ('Guantes Estériles #8', 600, 730),
    ('Cloruro Sódico 20% 10ml', 2000, 90),
    ('Gluconato de Calcio 10ml', 1000, 60),
    ('Parche Hemostático', 500, 365),
    ('Cinta Adhesiva', 300, 730),
    ('Apósito Transparente', 1000, 730),
    ('Clorhexidina 500ml', 400, 180),
    ('Povidona Yodada 500ml', 400, 180),
]

def seed():
    with app.app_context():
        db.create_all()

        if Doctores.query.first():
            print('La BD ya tiene datos. Saliendo...')
            return

        print('Sembrando doctores...')
        for nombre in doctores_nombres:
            db.session.add(Doctores(nombre=nombre))
        db.session.commit()
        doctores = Doctores.query.all()

        print('Sembrando accesos...')
        for tipo in accesos_tipos:
            db.session.add(Accesos(tipo=tipo))
        db.session.commit()
        accesos = Accesos.query.all()

        print('Sembrando filtros...')
        for estado in filtros_estados:
            db.session.add(Filtros(estado=estado))
        db.session.commit()
        filtros = Filtros.query.all()

        print('Sembrando áreas...')
        for nombre in areas_nombres:
            db.session.add(Areas(nombre=nombre))
        db.session.commit()
        areas = Areas.query.all()

        print('Sembrando inventario...')
        for nombre, cantidad, caducidad_dias in inventario_items:
            db.session.add(Inventario(
                nombre=nombre,
                cantidad=cantidad,
                caducidad=date(2026, 7, 1) + timedelta(days=random.randint(0, 180)),
                area_id=random.choice(areas).id,
            ))
        db.session.commit()
        print(f'  {len(inventario_items)} items en inventario listos.')

        print('Sembrando 1000 pacientes...')
        for i in range(1000):
            nombre = f'{random.choice(nombres)} {random.choice(apellidos)}'
            fecha_nac = date(
                random.randint(1940, 2010),
                random.randint(1, 12),
                random.randint(1, 28),
            )
            paciente = Pacientes(
                no_expediente=5000 + i,
                nombre=nombre,
                fecha_nacimiento=fecha_nac,
                hierros=random.choice([random.randint(1, 6)]),
                eritropoyetina=random.choice([random.randint(1, 8)]),
                acceso_id=random.choice(accesos).id,
                doctor_id=random.choice(doctores).id,
                observaciones=random.choice([None, 'FAV']),
                filtro_id=random.choice(filtros).id,
                fecha_inicio_filtro=random.choice([date(2025, 1, 1) + timedelta(days=random.randint(0, 365))]),
                fecha_fin_filtro=None,
            )
            db.session.add(paciente)

            if (i + 1) % 200 == 0:
                db.session.commit()
                print(f'  {i + 1} pacientes...')

        db.session.commit()
        print('  1000 pacientes listos.')

        pacientes_ids = [p.no_expediente for p in Pacientes.query.all()]

        print('Sembrando sesiones (30-50/día)...')
        start_date = date(2025, 1, 1)
        end_date = date(2026, 7, 28)
        all_dates = [start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)]

        total_sesiones = 0
        for d in all_dates:
            sesiones_hoy = random.randint(30, 50)
            minutos_slots = []
            for _ in range(sesiones_hoy):
                h = random.randint(7, 21)
                m = random.choice([0, 15, 30, 45])
                if h == 21 and m > 0:
                    m = 0
                minutos_slots.append((h, m))
            minutos_slots.sort()

            for h, m in minutos_slots:
                dt = datetime.combine(d, time(h, m, random.randint(0, 59)))
                sesion = Sesiones(
                    paciente_id=random.choice(pacientes_ids),
                    fecha_hora=dt,
                )
                db.session.add(sesion)
                total_sesiones += 1

        db.session.commit()
        print(f'  {total_sesiones} sesiones listas.')
        print('Seed completado.')

seed()
