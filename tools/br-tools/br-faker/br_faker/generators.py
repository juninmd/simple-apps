import random
import re

FIRST_NAMES = [
    "Ana", "Bruno", "Carla", "Daniel", "Eduardo", "Fernanda", "Gabriel", "Helena",
    "Igor", "Julia", "Lucas", "Mariana", "Nicolas", "Patricia", "Rafael", "Sofia",
    "Thiago", "Beatriz", "Rodrigo", "Camila", "Mateus", "Larissa", "Gustavo", "Amanda"
]

LAST_NAMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
    "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes",
    "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade"
]

STREET_TYPES = ["Rua", "Avenida", "Alameda", "Praça", "Travessa"]
STREET_NAMES = ["das Flores", "Brasil", "Paulista", "Sete de Setembro", "XV de Novembro", "São Paulo", "Copacabana", "Independência"]
CITIES = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Salvador", "Brasília", "Recife", "Fortaleza"]
STATES = [
    ("AC", "Acre"), ("AL", "Alagoas"), ("AP", "Aapá"), ("AM", "Amazonas"), ("BA", "Bahia"),
    ("CE", "Ceará"), ("DF", "Distrito Federal"), ("ES", "Espírito Santo"), ("GO", "Goiás"),
    ("MA", "Maranhão"), ("MT", "Mato Grosso"), ("MS", "Mato Grosso do Sul"), ("MG", "Minas Gerais"),
    ("PA", "Pará"), ("PB", "Paraíba"), ("PR", "Paraná"), ("PE", "Pernambuco"), ("PI", "Piauí"),
    ("RJ", "Rio de Janeiro"), ("RN", "Rio Grande do Norte"), ("RS", "Rio Grande do Sul"),
    ("RO", "Rondônia"), ("RR", "Roraima"), ("SC", "Santa Catarina"), ("SP", "São Paulo"),
    ("SE", "Sergipe"), ("TO", "Tocantins")
]

EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "yahoo.com.br", "outlook.com", "uol.com.br", "bol.com.br"]


def generate_cpf(formatted: bool = True) -> str:
    digits = [random.randint(0, 9) for _ in range(9)]

    # First digit check
    s = sum(d * w for d, w in zip(digits, range(10, 1, -1)))
    d1 = 11 - (s % 11)
    d1 = 0 if d1 >= 10 else d1
    digits.append(d1)

    # Second digit check
    s = sum(d * w for d, w in zip(digits, range(11, 1, -1)))
    d2 = 11 - (s % 11)
    d2 = 0 if d2 >= 10 else d2
    digits.append(d2)

    raw = "".join(map(str, digits))
    if formatted:
        return f"{raw[:3]}.{raw[3:6]}.{raw[6:9]}-{raw[9:]}"
    return raw


def generate_cnpj(formatted: bool = True) -> str:
    digits = [random.randint(0, 9) for _ in range(8)] + [0, 0, 0, 1]

    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    s1 = sum(d * w for d, w in zip(digits, weights1))
    d1 = 11 - (s1 % 11)
    d1 = 0 if d1 >= 10 else d1
    digits.append(d1)

    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    s2 = sum(d * w for d, w in zip(digits, weights2))
    d2 = 11 - (s2 % 11)
    d2 = 0 if d2 >= 10 else d2
    digits.append(d2)

    raw = "".join(map(str, digits))
    if formatted:
        return f"{raw[:2]}.{raw[2:5]}.{raw[5:8]}/{raw[8:12]}-{raw[12:]}"
    return raw


def generate_name() -> str:
    first = random.choice(FIRST_NAMES)
    last1 = random.choice(LAST_NAMES)
    last2 = random.choice(LAST_NAMES)
    while last2 == last1:
        last2 = random.choice(LAST_NAMES)
    return f"{first} {last1} {last2}"


def _normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[áàãâä]', 'a', text)
    text = re.sub(r'[éèêë]', 'e', text)
    text = re.sub(r'[íìîï]', 'i', text)
    text = re.sub(r'[óòõôö]', 'o', text)
    text = re.sub(r'[úùûü]', 'u', text)
    text = re.sub(r'[ç]', 'c', text)
    text = re.sub(r'[^a-z0-9]', '', text)
    return text


def generate_email(name: str | None = None) -> str:
    if not name:
        name = generate_name()
    parts = name.split()
    first = _normalize(parts[0])
    last = _normalize(parts[-1])
    num = random.randint(10, 99)
    domain = random.choice(EMAIL_DOMAINS)
    return f"{first}.{last}{num}@{domain}"


def generate_phone(formatted: bool = True) -> str:
    ddd = random.randint(11, 99)
    number = f"9{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
    if formatted:
        return f"({ddd}) {number[:5]}-{number[5:]}"
    return f"{ddd}{number}"


def generate_address() -> dict[str, str] | str:
    street = f"{random.choice(STREET_TYPES)} {random.choice(STREET_NAMES)}"
    number = str(random.randint(1, 1500))
    city = random.choice(CITIES)
    uf, state_name = random.choice(STATES)
    cep = f"{random.randint(10, 99):02d}{random.randint(100, 999):03d}-{random.randint(100, 999):03d}"

    return {
        "street": street,
        "number": number,
        "city": city,
        "state": uf,
        "cep": cep
    }


def generate_person(formatted: bool = True) -> dict[str, str]:
    name = generate_name()
    email = generate_email(name)
    cpf = generate_cpf(formatted=formatted)
    phone = generate_phone(formatted=formatted)
    address = generate_address()

    return {
        "name": name,
        "cpf": cpf,
        "email": email,
        "phone": phone,
        "address": f"{address['street']}, {address['number']} - {address['city']}/{address['state']} - CEP {address['cep']}"
    }
