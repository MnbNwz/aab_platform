import React, { useState, useEffect } from "react";
import PropertyManagementTable from "./dashboard/PropertyManagementTable";
import PropertyFormModal from "./dashboard/PropertyFormModal";

interface Property {
  _id: string;
  title: string;
  propertyType: string;
  address: string;
  location: { type: string; coordinates: [number, number] };
  dimensions: { length: number; width: number };
  totalRooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description: string;
  images: string[];
  isActive: boolean;
}

interface MyPropertiesProps {
  userRole: string;
}

const MyProperties: React.FC<MyPropertiesProps> = ({ userRole }) => {
  if (userRole !== "admin" && userRole !== "customer") return null;

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset filters on component unmount
  useEffect(() => {
    return () => {
      setFilter("all");
      setSortOrder("asc");
      setSearch("");
      setPage(1);
    };
  }, []);

  return (
    <div>
      <PropertyManagementTable
        filter={filter}
        setFilter={setFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        search={search}
        setSearch={setSearch}
        properties={properties}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        onCreateNew={() => setPropertyModalOpen(true)}
      />
      <PropertyFormModal
        isOpen={propertyModalOpen}
        onClose={() => setPropertyModalOpen(false)}
        onSave={() => {
          setPropertyModalOpen(false);
        }}
      />
    </div>
  );
};

export default MyProperties;
