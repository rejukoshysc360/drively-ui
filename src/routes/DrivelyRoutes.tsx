// src/routes/DrivelyRoutes.tsx

import { Route } from "react-router-dom";

import CustomerList from "../features/drively/customers/CustomerList";
import CustomerForm from "../features/drively/customers/CustomerForm";
import CustomerDetail from "../features/drively/customers/CustomerDetail";

import VehicleList from "../features/drively/vehicles/VehicleList";
import VehicleForm from "../features/drively/vehicles/VehicleForm";
import VehicleDetail from "../features/drively/vehicles/VehicleDetail";

export const drivelyRoutes = (
  <>
    {/* CUSTOMERS */}

    <Route
      path="/customers"
      element={<CustomerList />}
    />

    <Route
      path="/customers/create"
      element={<CustomerForm />}
    />

    <Route
      path="/customers/:customerId"
      element={<CustomerDetail />}
    />

    <Route
      path="/customers/:customerId/edit"
      element={<CustomerForm />}
    />

    {/* VEHICLES */}

    <Route
      path="/vehicles"
      element={<VehicleList />}
    />

    <Route
      path="/vehicles/create"
      element={<VehicleForm />}
    />

    <Route
      path="/vehicles/:vehicleId"
      element={<VehicleDetail />}
    />

    <Route
      path="/vehicles/:vehicleId/edit"
      element={<VehicleForm />}
    />
  </>
);