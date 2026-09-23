"use client";

import { useState } from "react";

type ShippingMethod = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  fee_cents: number;
};

type UberSettings = {
  uber_online: boolean;
  uber_origin_label: string | null;
  uber_origin_lat: number | string | null;
  uber_origin_lng: number | string | null;
  uber_radius_km: number | string;
  uber_fee_cents: number;
};

function toRad(value: number) {
  return value * Math.PI / 180;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

export function FixedShippingPicker({
  methods,
  uberSettings,
}: {
  methods: ShippingMethod[];
  uberSettings: UberSettings | null;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState("");
  const [deliveryLongitude, setDeliveryLongitude] = useState("");
  const [uberStatus, setUberStatus] = useState<"idle" | "checking" | "available" | "outside" | "error">("idle");
  const [uberDistance, setUberDistance] = useState<number | null>(null);

  const uberMethod = methods.find((method) => method.code === "uber-delivery");
  const standardMethods = methods.filter((method) => method.code !== "uber-delivery");

  const originLat = Number(uberSettings?.uber_origin_lat);
  const originLng = Number(uberSettings?.uber_origin_lng);
  const radiusKm = Number(uberSettings?.uber_radius_km);
  const canCheckUber =
    Boolean(uberSettings?.uber_online)
    && Number.isFinite(originLat)
    && Number.isFinite(originLng)
    && Number.isFinite(radiusKm)
    && radiusKm > 0
    && Boolean(uberMethod);

  function selectStandard(methodId: string) {
    setSelectedId(methodId);
    setUberStatus("idle");
    setUberDistance(null);
    setDeliveryLatitude("");
    setDeliveryLongitude("");
  }

  function checkUber() {
    if (!canCheckUber || !uberMethod) return;

    if (!navigator.geolocation) {
      setUberStatus("error");
      return;
    }

    setUberStatus("checking");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const km = distanceKm(originLat, originLng, lat, lng);

        setUberDistance(km);

        if (km <= radiusKm) {
          setDeliveryLatitude(String(lat));
          setDeliveryLongitude(String(lng));
          setSelectedId(uberMethod.id);
          setUberStatus("available");
        } else {
          setDeliveryLatitude("");
          setDeliveryLongitude("");
          if (selectedId === uberMethod.id) setSelectedId("");
          setUberStatus("outside");
        }
      },
      () => {
        setDeliveryLatitude("");
        setDeliveryLongitude("");
        if (selectedId === uberMethod.id) setSelectedId("");
        setUberStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  return (
    <div className="fixed-shipping-picker">
      <input type="hidden" name="shippingMethodId" value={selectedId} />
      <input type="hidden" name="deliveryLatitude" value={deliveryLatitude} />
      <input type="hidden" name="deliveryLongitude" value={deliveryLongitude} />

      <div className="fixed-shipping-list">
        {standardMethods.map((method) => (
          <button
            type="button"
            key={method.id}
            onClick={() => selectStandard(method.id)}
            className={selectedId === method.id ? "is-selected" : ""}
          >
            <span>
              <strong>{method.name}</strong>
              <small>{method.description}</small>
            </span>
            <b>R{(method.fee_cents / 100).toFixed(0)}</b>
          </button>
        ))}
      </div>

      {canCheckUber && uberMethod ? (
        <div className="uber-shipping-card">
          <div className="uber-shipping-head">
            <span>
              <i>●</i>
              <strong>Uber delivery</strong>
              <small>
                Local delivery · up to R{Math.min(100, (uberSettings?.uber_fee_cents ?? 10000) / 100).toFixed(0)}
              </small>
            </span>
            <b>Online now</b>
          </div>

          {uberStatus === "available" ? (
            <button
              type="button"
              className={selectedId === uberMethod.id ? "uber-available is-selected" : "uber-available"}
              onClick={() => setSelectedId(uberMethod.id)}
            >
              <span>
                <strong>Uber delivery available</strong>
                <small>
                  You&apos;re approximately {uberDistance?.toFixed(1)} km from {uberSettings?.uber_origin_label || "our dispatch point"}.
                </small>
              </span>
              <b>R{Math.min(100, (uberSettings?.uber_fee_cents ?? 10000) / 100).toFixed(0)}</b>
            </button>
          ) : (
            <button
              type="button"
              onClick={checkUber}
              className="uber-check-button"
              disabled={uberStatus === "checking"}
            >
              {uberStatus === "checking" ? "Checking your location…" : "Check Uber availability"}
            </button>
          )}

          {uberStatus === "outside" ? (
            <p className="uber-shipping-message">
              You&apos;re about {uberDistance?.toFixed(1)} km away, outside the current {radiusKm.toFixed(0)} km Uber delivery radius.
            </p>
          ) : null}

          {uberStatus === "error" ? (
            <p className="uber-shipping-message">
              We couldn&apos;t access your location. Enable location access to use Uber delivery.
            </p>
          ) : null}
        </div>
      ) : null}

      {!selectedId ? (
        <p className="fixed-shipping-help">Choose a delivery method to continue.</p>
      ) : null}
    </div>
  );
}
