import re
import pytest

from br_faker.generators import (
    generate_address,
    generate_cnpj,
    generate_cpf,
    generate_email,
    generate_name,
    generate_person,
    generate_phone,
)


def test_generate_cpf():
    formatted_cpf = generate_cpf(formatted=True)
    assert re.match(r"^\d{3}\.\d{3}\.\d{3}-\d{2}$", formatted_cpf)

    unformatted_cpf = generate_cpf(formatted=False)
    assert re.match(r"^\d{11}$", unformatted_cpf)


def test_generate_cnpj():
    formatted_cnpj = generate_cnpj(formatted=True)
    assert re.match(r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$", formatted_cnpj)

    unformatted_cnpj = generate_cnpj(formatted=False)
    assert re.match(r"^\d{14}$", unformatted_cnpj)


def test_generate_name():
    name = generate_name()
    parts = name.split()
    assert len(parts) >= 2


def test_generate_email():
    email = generate_email()
    assert "@" in email
    assert "." in email


def test_generate_phone():
    formatted_phone = generate_phone(formatted=True)
    assert re.match(r"^\(\d{2}\) \d{5}-\d{4}$", formatted_phone)

    unformatted_phone = generate_phone(formatted=False)
    assert re.match(r"^\d{11}$", unformatted_phone)


def test_generate_address():
    addr = generate_address()
    assert isinstance(addr, dict)
    assert "street" in addr
    assert "number" in addr
    assert "city" in addr
    assert "state" in addr
    assert "cep" in addr


def test_generate_person():
    person = generate_person()
    assert isinstance(person, dict)
    assert "name" in person
    assert "cpf" in person
    assert "email" in person
    assert "phone" in person
    assert "address" in person
