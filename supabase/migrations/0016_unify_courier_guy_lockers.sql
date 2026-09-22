-- PUDO/locker delivery now runs through The Courier Guy's ShipLogic account.
-- Normalise any development/test shipment rows created before the provider consolidation.
update public.shipments
set provider = 'courier_guy'
where provider = 'pudo';
