import json
import pytest
from br_faker.cli import create_parser, main


def test_cli_single_item(capsys):
    main(["cpf"])
    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().split("\n") if line]
    assert len(lines) == 1


def test_cli_batch_quantity(capsys):
    main(["cpf", "-n", "5"])
    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().split("\n") if line]
    assert len(lines) == 5


def test_cli_batch_quantity_long_flag(capsys):
    main(["name", "--quantity", "3"])
    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().split("\n") if line]
    assert len(lines) == 3


def test_cli_batch_json_single(capsys):
    main(["person", "--json"])
    captured = capsys.readouterr()
    data = json.loads(captured.out)
    assert isinstance(data, dict)


def test_cli_batch_json_multiple(capsys):
    main(["person", "-n", "4", "--json"])
    captured = capsys.readouterr()
    data = json.loads(captured.out)
    assert isinstance(data, list)
    assert len(data) == 4


def test_cli_invalid_quantity():
    parser = create_parser()
    with pytest.raises(SystemExit):
        main(["cpf", "-n", "0"])


def test_cli_unformatted(capsys):
    main(["cpf", "-n", "2", "--unformatted"])
    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().split("\n") if line]
    assert len(lines) == 2
    for line in lines:
        assert line.isdigit()
        assert len(line) == 11


def test_cli_missing_type_is_an_error():
    with pytest.raises(SystemExit):
        main([])


@pytest.mark.parametrize("shell", ["bash", "zsh", "fish"])
def test_cli_completion_script_lists_types(capsys, shell):
    main(["--completion", shell])
    out = capsys.readouterr().out
    for t in ["cpf", "cnpj", "name", "email", "phone", "address", "person"]:
        assert t in out
    assert "quantity" in out


def test_cli_completion_rejects_unknown_shell():
    with pytest.raises(SystemExit):
        main(["--completion", "powershell"])
