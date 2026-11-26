import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.schemas.brand import BrandOut
from app.schemas.campaign import CampaignOut
from app.services.brand_context import build_context, render_prompt

ex = ROOT / "docs" / "examples"
brand = BrandOut.model_validate(json.loads((ex / "brand.json").read_text(encoding="utf-8")))
campaign = CampaignOut.model_validate(json.loads((ex / "campaign.json").read_text(encoding="utf-8")))
out = ROOT / "docs" / "evidence" / "prompt_v1_sample.txt"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(render_prompt(build_context(brand, campaign)), encoding="utf-8")
print("Saved", out)