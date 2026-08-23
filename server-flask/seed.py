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
from models.metodo_pago import MetodoPago

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

metodos_pago_nombres = ['Efectivo', 'Tarjeta', 'Transferencia']

inventario_nombres_base = [
    'Heparina', 'Suero Fisiológico', 'Suero Fisiológico', 'Agua Estéril',
    'Bicarbonato', 'Dializador', 'Línea Arterial', 'Línea Venosa',
    'Fístula Aguja', 'Jeringa', 'Gasas Estériles', 'Guantes Estériles',
    'Cloruro Sódico', 'Gluconato de Calcio', 'Parche Hemostático',
    'Cinta Adhesiva', 'Apósito Transparente', 'Clorhexidina',
    'Povidona Yodada', 'Metoclopramida', 'Omeprazol', 'Ranitidina',
    'Insulina', 'Paracetamol', 'Ibuprofeno', 'Amoxicilina', 'Ceftriaxona',
    'Vancomicina', 'Furosemida', 'Dexametasona', 'Prednisona', 'Losartán',
    'Enalapril', 'Amlodipina', 'Metformina', 'Simvastatina', 'Warfarina',
    'Clopidogrel', 'Levotiroxina', 'Vitamina B12', 'Hierro Sacarosa',
]

inventario_presentaciones = ['500ml', '1000ml', '100ml', '10ml', '5ml', '20%', '40mg', '25mg', '500mg', '#7', '#7.5', '#8', '15G', '16G']

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

        print('Sembrando métodos de pago...')
        for nombre in metodos_pago_nombres:
            db.session.add(MetodoPago(nombre=nombre))
        db.session.commit()

        print('Sembrando 100000 medicamentos...')
        for i in range(100000):
            nombre = f'{random.choice(inventario_nombres_base)} {random.choice(inventario_presentaciones)}'
            db.session.add(Inventario(
                codigo=5000000 + i,
                nombre=nombre,
                cantidad=random.randint(10, 20000),
                caducidad=date(2026, 7, 1) + timedelta(days=random.randint(0, 180)),
                area_id=random.choice(areas).id,
            ))
            if (i + 1) % 2000 == 0:
                db.session.commit()
                print(f'  {i + 1} medicamentos...')
        db.session.commit()
        print('  100000 medicamentos listos.')

        print('Sembrando 1000 pacientes...')
        for i in range(1000):
            nombre = f'{random.choice(nombres)} {random.choice(nombres)} {random.choice(apellidos)} {random.choice(apellidos)}'
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
                usos_restantes=random.choice([random.randint(1, 30)]),
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

        pacientes_ids = [p.id for p in Pacientes.query.all()]

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
