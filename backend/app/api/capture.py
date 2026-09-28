# =========================================================
# NetMine AI — /api/capture (Phase 9)
#
# FastAPI router for real-time packet capture, interface
# discovery, and live ML flow streaming.
# =========================================================
import asyncio
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from packet_capture.capture_engine import LiveCaptureEngine

router = APIRouter(prefix="/api/capture", tags=["Live Capture"])
engine = LiveCaptureEngine.get_instance()


class StartCapturePayload(BaseModel):
    interface: str = "5"
    name: Optional[str] = "Wi-Fi"


@router.get("/interfaces", summary="List available network capture interfaces")
async def get_interfaces():
    """Returns all network interfaces detected by TShark on Windows."""
    return {"interfaces": engine.list_interfaces()}


@router.post("/start", summary="Start real-time packet capture")
async def start_capture(payload: StartCapturePayload):
    """Starts live packet capture and ML inference on the specified interface."""
    res = engine.start_capture(interface=payload.interface, interface_name=payload.name or "Wi-Fi")
    return res


@router.post("/stop", summary="Stop real-time packet capture")
async def stop_capture():
    """Stops the live capture process."""
    res = engine.stop_capture()
    return res


@router.get("/status", summary="Get live capture engine status")
async def get_status():
    """Returns throughput, packet counts, and active status."""
    return engine.get_status()


@router.get("/flows", summary="Get recent classified flows")
async def get_recent_flows(limit: int = 50):
    """Returns the most recent network flows processed through live ML models."""
    flows = engine.get_recent_flows(limit=limit)
    return {
        "flows": flows,
        "total": len(flows),
        "data_source": "LIVE_CAPTURE" if engine.is_running else ("RECENT_CACHE" if flows else "IDLE"),
    }


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket connection for live telemetry.
    Streams capture status and newly arrived flows every 500ms.
    """
    await websocket.accept()
    last_flow_count = 0

    try:
        while True:
            status = engine.get_status()
            recent = engine.get_recent_flows(limit=20)
            payload = {
                "type": "telemetry",
                "status": status,
                "flows": recent,
            }
            await websocket.send_json(payload)
            await asyncio.sleep(0.5)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception:
        pass
