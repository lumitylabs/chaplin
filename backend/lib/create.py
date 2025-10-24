#!/usr/bin/env python3
"""
firebase_services_to_env.py

Converte um arquivo services.json (Firebase) para um formato "inline" utilizável em um arquivo .env.

Modos de saída:
  1) --inline : gera uma variável única FIREBASE_SERVICES_JSON contendo o JSON minificado (padrão para .env)
  2) --flatten: gera variáveis separadas flattenadas (ex: FIREBASE_PROJECT_ID=...). Chaves são convertidas para MAIÚSCULAS e separadas por _

Uso exemplo:
  # Inline (uma variável contendo todo o JSON)
  python firebase_services_to_env.py services.json --inline --out .env

  # Flatten (múltiplas variáveis)
  python firebase_services_to_env.py services.json --flatten --out .env

Opções úteis:
  --env-var NAME  : muda o nome da variável quando usando --inline (padrão FIREBASE_SERVICES_JSON)
  --pretty        : escreve JSON com indentação quando usar --inline (útil para debug, mas não recomendado em .env)
  --sep SEP       : separador usado ao flatten (padrão _)

Observações:
  - Arrays e objetos aninhados no modo flatten serão serializados como JSON string.
  - O script tenta escapar corretamente aspas simples quando escreve inline entre aspas simples.

"""

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict


def normalize_key(parts, sep="_"):
    """Transforma partes de chave em MAIÚSCULAS e válidas para .env (A-Z0-9_).
    Ex: ['project_info','project_id'] -> 'PROJECT_INFO_PROJECT_ID'
    """
    def clean(s: str):
        s2 = re.sub(r"[^0-9a-zA-Z]+", sep, s)
        s2 = re.sub(r"_{2,}", "_", s2)
        s2 = s2.strip(sep)
        return s2.upper() if s2 else ""

    return sep.join(p for p in (clean(p) for p in parts) if p)


def flatten_dict(d: Dict[str, Any], parent_keys=None, sep="_") -> Dict[str, str]:
    """Flatten a dict recursivamente. Values non-primtivos viram JSON string."""
    out = {}
    parent_keys = parent_keys or []
    for k, v in d.items():
        new_keys = parent_keys + [str(k)]
        if isinstance(v, dict):
            out.update(flatten_dict(v, new_keys, sep=sep))
        elif isinstance(v, list):
            out[normalize_key(new_keys, sep)] = json.dumps(v, ensure_ascii=False)
        else:
            # stringify primitives
            out[normalize_key(new_keys, sep)] = "" if v is None else str(v)
    return out


def read_json(path: Path) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def escape_single_quotes_for_env(s: str) -> str:
    """Quando usamos aspas simples em .env, precisamos escapar qualquer ' dentro do conteúdo.
    Uma técnica segura: encerrar com ' + "'" + ' e seguir. Mas nos .env geralmente aceitaremos substituição simples: replace("'", "'\\''")
    Essa é a forma POSIX de escapar single quote dentro single-quoted string.
    """
    return s.replace("'", "'\\''")


def write_env_file(lines, out_path: Path):
    with open(out_path, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")


def main():
    p = argparse.ArgumentParser(description="Converte services.json do Firebase para formato .env (inline ou flatten)")
    p.add_argument("input", help="caminho para services.json")
    p.add_argument("--inline", action="store_true", help="gerar uma única variável com o JSON inteiro")
    p.add_argument("--flatten", action="store_true", help="gerar variáveis separadas flattenadas")
    p.add_argument("--env-var", default="FIREBASE_SERVICES_JSON", help="nome da variável quando usar --inline")
    p.add_argument("--out", default=None, help="arquivo de saída (.env). Se omitido, escreve no stdout")
    p.add_argument("--pretty", action="store_true", help="imprime JSON com indentação (apenas para --inline)")
    p.add_argument("--sep", default="_", help="separador para keys ao flatten (padrão _)")

    args = p.parse_args()
    input_path = Path(args.input)
    if not input_path.exists():
        raise SystemExit(f"Arquivo não encontrado: {input_path}")

    data = read_json(input_path)

    # Default behavior: inline se nada for especificado
    if not args.inline and not args.flatten:
        args.inline = True

    lines = []
    if args.inline:
        if args.pretty:
            json_text = json.dumps(data, ensure_ascii=False, indent=2)
        else:
            json_text = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        # Escape single quotes para colocar entre aspas simples em .env
        escaped = escape_single_quotes_for_env(json_text)
        line = f"{args.env_var}='{escaped}'"
        lines.append(line)

    if args.flatten:
        flat = flatten_dict(data, sep=args.sep)
        for k, v in flat.items():
            # Se o value contém espaços ou caracteres especiais, podemos optar por envolver em aspas duplas
            # Aqui vamos envolver em aspas duplas se houver espaços ou caracteres especiais
            if re.search(r"\s|['\"]", v):
                safe = v.replace('"', '\\"')
                lines.append(f"{k}=\"{safe}\"")
            else:
                lines.append(f"{k}={v}")

    if args.out:
        out_path = Path(args.out)
        write_env_file(lines, out_path)
        print(f"Arquivo .env escrito em: {out_path}")
    else:
        for l in lines:
            print(l)


if __name__ == '__main__':
    main()
