from fastapi import APIRouter, Query
from typing import Optional
from app.schemas import DeviceList
from app.services.mock_data import DEMO_DEVICES

router = APIRouter(prefix="/api/devices", tags=["Devices"])

@router.get("", response_model=DeviceList, summary="Get discovered devices")
async def get_devices(
    status: Optional[str] = Query(None, description="Filter by status: active|suspicious|inactive"),
) -> DeviceList:
    """
    Returns network host inventory.
    Data source: DEMO until Phase 9 live capture + Phase 4 database.
    """
    devices = DEMO_DEVICES
    if status:
        devices = [d for d in devices if d.status == status.lower()]
    return DeviceList(devices=devices, total=len(devices), data_source="DEMO")
