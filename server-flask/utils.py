import unicodedata
from sqlalchemy import literal_column


def normalizar_cadena(texto):
    return ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')


def col_sin_acentos(col):
    return literal_column(
        f"regexp_replace(pg_catalog.normalize({col.table.name}.{col.name}::text, 'NFD'), "
        "'[' || chr(768) || '-' || chr(879) || ']', '', 'g')"
    )
