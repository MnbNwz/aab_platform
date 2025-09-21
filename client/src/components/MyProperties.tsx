import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import PropertyManagementTable from "./dashboard/PropertyManagementTable";
import PropertyFormModal from "./dashboard/PropertyFormModal";

interface MyPropertiesProps {
  userRole: string;
}

const MyProperties: React.FC<MyPropertiesProps> = ({ userRole }) => {
  if (userRole !== "admin" && userRole !== "customer") return null;

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Get properties from Redux store instead of local state
  const { properties } = useSelector((state: RootState) => state.property);

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
        properties={properties as any}
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
