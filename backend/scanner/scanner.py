import re
import os
from typing import List, Dict, Tuple

# Regex Patterns 
REGEX_PATTERNS: List[Tuple[str, str, str, str]] = [
    # (pattern, type, confidence, description)
    (r'AKIA[0-9A-Z]{16}', "AWS_KEY", "HIGH", "AWS Access Key ID"),
    (r'(?i)aws.{0,20}secret.{0,20}[\'"]([0-9a-zA-Z/+]{40})[\'"]', "AWS_SECRET", "HIGH", "AWS Secret Key"),
    (r'eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}', "JWT", "HIGH", "JSON Web Token"),
    (r'-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----', "PRIVATE_KEY", "HIGH", "Private Key"),
    (r'ghp_[a-zA-Z0-9]{36}', "GITHUB_TOKEN", "HIGH", "GitHub Personal Access Token"),
    (r'gho_[a-zA-Z0-9]{36}', "GITHUB_OAUTH", "HIGH", "GitHub OAuth Token"),
    (r'ghs_[a-zA-Z0-9]{36}', "GITHUB_APP", "HIGH", "GitHub App Token"),
    (r'sk-[a-zA-Z0-9]{48}', "OPENAI_KEY", "HIGH", "OpenAI API Key"),
    (r'xox[boaprs]-[0-9a-zA-Z\-]{10,72}', "SLACK_TOKEN", "HIGH", "Slack Token"),
    (r'(?i)stripe.{0,20}[\'"]sk_(live|test)_[a-zA-Z0-9]{24,}[\'"]', "STRIPE_KEY", "HIGH", "Stripe Secret Key"),
    (r'(?i)(password|passwd|pwd)\s*[=:]\s*[\'"][^\'"]{8,}[\'"]', "PASSWORD", "HIGH", "Hardcoded Password"),
    (r'(?i)(password|passwd|pwd)\s*=\s*(?!.*#)[^\s\'"]{8,}', "PASSWORD", "MEDIUM", "Possible Password"),
    (r'(?i)(api[_-]?key|apikey)\s*[=:]\s*[\'"][a-zA-Z0-9_\-]{20,}[\'"]', "API_KEY", "HIGH", "API Key"),
    (r'(?i)(api[_-]?key|apikey)\s*[=:]\s*(?!.*#)[a-zA-Z0-9_\-]{20,}', "API_KEY", "MEDIUM", "Possible API Key"),
    (r'(?i)(secret|secret_key|client_secret)\s*[=:]\s*[\'"][a-zA-Z0-9_\-\.]{16,}[\'"]', "SECRET", "HIGH", "Secret Value"),
    (r'(?i)(token|access_token|auth_token|bearer)\s*[=:]\s*[\'"][a-zA-Z0-9_\-\.]{20,}[\'"]', "TOKEN", "HIGH", "Auth Token"),
    (r'Bearer\s+[a-zA-Z0-9_\-\.]{20,}', "BEARER_TOKEN", "HIGH", "Bearer Token"),
    (r'(?i)(mongodb(\+srv)?|postgresql|mysql|redis)://[^\s\'"<>]{10,}', "DATABASE_URL", "HIGH", "Database Connection URL"),
    (r'(?i)(?:smtp|imap|pop3)://[a-zA-Z0-9_\-\.]+:[^\s@/]{6,}@', "EMAIL_CREDS", "HIGH", "Email Credentials"),
    (r'[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}:[^\s]{8,}', "CREDENTIALS", "MEDIUM", "Email:Password Pair"),
]

# ML Setup
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    import numpy as np

    _POSITIVE_SAMPLES = [
        'password = "supersecret123"',
        'API_KEY = "abc123def456ghi789jkl012mno345"',
        'secret_token = "verylongsecretvalue1234567890abcdef"',
        'AKIA1234567890ABCDEF',
        'aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"',
        'db_password = "MyP@ssw0rd!#2024"',
        'mongodb://admin:secretpass@prod-cluster.mongodb.net:27017',
        'client_secret = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b"',
        'bearer token = "eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QifQ"',
        'SECRET_KEY = "django-insecure-abc123xyz789-do-not-share"',
        'STRIPE_SECRET_KEY = "sk_live_1234567890abcdefghijklmn"',
        'private_key = "-----BEGIN RSA PRIVATE KEY-----"',
        'auth_token: ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890',
        'smtp://user:password123@mail.example.com:587',
        'redis://default:myredispassword@redis-host:6379',
        'access_key_id = AKIAIOSFODNN7EXAMPLE',
        'xoxb-1234567890-1234567890123-abc123defg456hijklmnopqrs',
        'sk-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
        'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
        'DATABASE_URL = "postgresql://user:pass@host:5432/dbname"',
        'password = os.environ.get("PASSWORD", "fallback_secret_value_here")',
        'JWT_SECRET = "my-super-secret-jwt-key-that-should-not-be-here"',
    ]

    _NEGATIVE_SAMPLES = [
        'def calculate_sum(a, b): return a + b',
        'import os, sys, json, logging',
        'print("Hello, World!")',
        'for i in range(10): print(i)',
        'class MyClass: pass',
        'if __name__ == "__main__": main()',
        'x = 5 + 3 * 2',
        '# This is a comment',
        'result = process_data(input_list)',
        'return {"status": "success", "data": items}',
        'logger.info("Processing request for user %s", user_id)',
        'from typing import List, Dict, Optional, Union',
        'response.status_code == 200',
        'user.username = request.form["username"]',
        'config = load_config("settings.yaml")',
        'def __init__(self, name: str, value: int):',
        'raise ValueError("Invalid input provided")',
        'assert len(results) > 0, "Results should not be empty"',
        'with open("data.txt", "r") as f: content = f.read()',
        'cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))',
        'app.config["DEBUG"] = True',
        'PORT = int(os.environ.get("PORT", 8080))',
        'version = "1.2.3"',
        'MAX_RETRIES = 3',
        'DEFAULT_TIMEOUT = 30',
    ]

    _pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(2, 4),
            max_features=2000,
            sublinear_tf=True,
        )),
        ("clf", LogisticRegression(C=1.0, max_iter=1000, random_state=42)),
    ])

    _X = _POSITIVE_SAMPLES + _NEGATIVE_SAMPLES
    _y = [1] * len(_POSITIVE_SAMPLES) + [0] * len(_NEGATIVE_SAMPLES)
    _pipeline.fit(_X, _y)
    ML_AVAILABLE = True

except ImportError:
    ML_AVAILABLE = False
    _pipeline = None


def _mask_value(value: str) -> str:
    if len(value) <= 8:
        return "****"
    return value[:4] + "****" + value[-4:]


def _regex_scan_line(line: str, line_num: int) -> List[Dict]:
    findings = []
    seen_spans: List[Tuple[int, int]] = []

    print("RUNNING REGEX")
    print(REGEX_PATTERNS)

    for pattern, secret_type, confidence, description in REGEX_PATTERNS:
        print(f"  DEBUG [_regex_scan_line] L{line_num} | testing {secret_type}")
        matches = list(re.finditer(pattern, line))
        if not matches:
            print(f"  DEBUG [_regex_scan_line] L{line_num} | {secret_type} → no match")
            continue

        for match in matches:
            span = match.span()
            if any(s <= span[0] < e or s < span[1] <= e for s, e in seen_spans):
                print(f"  DEBUG [_regex_scan_line] L{line_num} | {secret_type} → skipped (overlaps prior match)")
                continue
            seen_spans.append(span)
            raw_value = match.group(0)
            print(f"  DEBUG [_regex_scan_line] L{line_num} | {secret_type} → MATCHED: {raw_value[:60]!r}")
            findings.append({
                "type": secret_type,
                "value": raw_value[:120],
                "method": "regex",
                "confidence": confidence,
                "line": line_num,
                "description": description,
            })

    return findings


def _ml_scan_line(line: str, line_num: int) -> List[Dict]:
    if not ML_AVAILABLE or _pipeline is None:
        return []
    if len(line.strip()) < 10:
        return []

    proba = _pipeline.predict_proba([line])[0][1]
    if proba >= 0.80:
        confidence = "HIGH" if proba >= 0.92 else "MEDIUM"
        return [{
            "type": "UNKNOWN",
            "value": line.strip()[:120],
            "method": "ml",
            "confidence": confidence,
            "line": line_num,
            "description": f"ML-detected secret (confidence: {proba:.0%})",
        }]
    return []


def scan_text(text: str) -> List[Dict]:
    print("SCAN_TEXT CALLED")

    findings: List[Dict] = []
    lines = text.splitlines()

    for line_num, line in enumerate(lines, start=1):
        line = line.rstrip()
        if not line:
            continue

        print(f"DEBUG [scan_text] Line {line_num}: {line!r}")

        regex_hits = _regex_scan_line(line, line_num)
        if regex_hits:
            print(f"DEBUG [scan_text] Line {line_num}: regex matched → {[h['type'] for h in regex_hits]}")
        else:
            print(f"DEBUG [scan_text] Line {line_num}: no regex match")
        findings.extend(regex_hits)

        # Only run ML on lines with no regex hit (avoid double-reporting)
        if not regex_hits:
            ml_hits = _ml_scan_line(line, line_num)
            findings.extend(ml_hits)

    # Deduplicate by (type, value, line)
    seen = set()
    unique: List[Dict] = []
    for f in findings:
        key = (f["type"], f["value"][:40], f.get("line"))
        if key not in seen:
            seen.add(key)
            unique.append(f)

    return unique


def scan_file(file_path: str) -> List[Dict]:
    print("SCAN_FILE CALLED")

    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as fh:
            text = fh.read()
    except OSError as exc:
        raise ValueError(f"Cannot read file: {exc}") from exc

    print("DEBUG [scan_file] FILE CONTENT:")
    print(text)

    print("CALLING SCAN_TEXT")
    results = scan_text(text)

    print("DEBUG [scan_file] RESULTS BEFORE RETURN:")
    for r in results:
        print(r)

    return results
