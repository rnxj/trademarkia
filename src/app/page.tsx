"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Beaker, Gavel, RefreshCcw, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type FormattedResult = {
  description: string[];
  classCodes: string[];
  statusType: string;
  statusDate: number;
  renewalDate: number;
  registrationNumber: string;
  registrationDate: number;
  currentOwner: string;
};

const columns: ColumnDef<FormattedResult>[] = [
  {
    accessorKey: "mark",
    header: () => <div className="font-semibold dark:text-white">Main</div>,
    cell: () => (
      <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-md">
        <Gavel className="w-10 h-10 text-gray-400" />
      </div>
    ),
  },
  {
    accessorKey: "details",
    header: () => <div className="font-semibold dark:text-white">Details</div>,
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-semibold">{row.original.currentOwner}</div>
        <div className="text-xs">{row.original.registrationNumber}</div>
        <div className="text-xs font-semibold">
          {new Date(
            new Date(0).setUTCSeconds(row.original.registrationDate)
          ).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="font-semibold dark:text-white">Status</div>,
    cell: ({ row }) => (
      <div className="space-y-1 min-w-32">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
          <span className="capitalize text-emerald-500">
            {row.original.statusType}
          </span>
        </div>
        <div className="text-sm font-semibold pb-4 capitalize">
          <span className="text-gray-500 text-xs">on </span>
          {new Date(new Date(0).setUTCSeconds(row.original.statusDate))
            .toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            .toLowerCase()}
        </div>
        <div className="text-sm flex items-center font-semibold capitalize">
          <RefreshCcw className="w-4 h-4 mr-1 text-red-500" />
          {new Date(new Date(0).setUTCSeconds(row.original.renewalDate))
            .toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            .toLowerCase()}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "classCodes",
    header: () => (
      <div className="font-semibold dark:text-white">Class/Description</div>
    ),
    cell: ({ row }) => {
      const description = row.original.description.join(" ");
      return (
        <div className="space-y-1">
          <div className="text-sm">
            {description.length > 170
              ? `${description.slice(0, 160)}...`
              : description}
          </div>
          <div className="flex flex-wrap gap-1">
            {row.original.classCodes.map((classCode, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Beaker className="w-3 h-3 mr-1" />
                Class {classCode}
              </Badge>
            ))}
          </div>
        </div>
      );
    },
  },
];

export default function TrademarkTable() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<FormattedResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const response = await fetch(
          "https://vit-tm-task.api.trademarkia.app/api/v3/us",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input_query: query,
              input_query_type: "",
              sort_by: "default",
              status: [],
              exact_match: false,
              date_query: false,
              owners: [],
              attorneys: [],
              law_firms: [],
              mark_description_description: [],
              classes: [],
              page: 1,
              rows: 10,
              sort_order: "desc",
              states: [],
              counties: [],
            }),
          }
        );
        const data = await response.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedResults = data.body.hits.hits.map((hit: any) => ({
          description: hit._source.mark_description_description,
          classCodes: hit._source.class_codes,
          statusType: hit._source.status_type,
          statusDate: hit._source.status_date,
          renewalDate: hit._source.renewal_date,
          registrationNumber: hit._source.registration_number,
          registrationDate: hit._source.registration_date,
          currentOwner: hit._source.current_owner,
        }));
        setResults(formattedResults);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const table = useReactTable({
    data: results,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-sm border-b pb-4 mb-4 font-semibold">
        About {results.length} Trademarks found for &quot;{query}&quot;
      </div>
      <div className="text-sm text-gray-500 mb-8">
        Also try searching for
        <Link href={`/?q=*${query}`} className="mx-1">
          <Badge
            variant="outline"
            className="text-xs bg-orange-400/30 border-orange-500 text-black dark:text-white"
          >
            {query}*
          </Badge>
        </Link>
        <Link href={`/?q=${query}*`} className="mx-1">
          <Badge
            variant="outline"
            className="text-xs bg-orange-400/30 border-orange-500 text-black dark:text-white"
          >
            *{query}
          </Badge>
        </Link>
      </div>
      <div className="grid grid-cols-9 gap-4">
        <div className="col-span-7">
          {loading ? (
            <p>Loading...</p>
          ) : results.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="font-semibold text-gray-900"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p>
              {query
                ? "No results found."
                : "Enter a search query to see results."}
            </p>
          )}
        </div>
        <div className="col-span-2 space-y-8">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-4">Status</h3>
            <div className="space-y-2">
              {["All", "Registered", "Pending", "Abandoned", "Others"].map(
                (status) => (
                  <div key={status} className="flex items-center mb-2">
                    <Button
                      variant="outline"
                      className={`flex items-center px-4 py-2 text-sm font-medium w-full justify-start ${!table
                        .getColumn("statusType")
                        ?.getFilterValue()}`}
                      onClick={() => {
                        if (
                          table.getColumn("statusType")?.getFilterValue() ===
                          status
                        ) {
                          table
                            .getColumn("statusType")
                            ?.setFilterValue(undefined);
                        } else {
                          table.getColumn("statusType")?.setFilterValue(status);
                        }
                      }}
                    >
                      <span
                        className={`w-3 h-3 rounded-full mr-2 ${
                          status === "Registered"
                            ? "bg-green-500"
                            : status === "Pending"
                            ? "bg-yellow-500"
                            : status === "Abandoned"
                            ? "bg-red-500"
                            : status === "Others"
                            ? "bg-purple-500"
                            : "bg-blue-500"
                        }`}
                      ></span>
                      {status}
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-4">Owners</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search Owners"
                value={
                  (table
                    .getColumn("currentOwner")
                    ?.getFilterValue() as string) ?? ""
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  table
                    .getColumn("currentOwner")
                    ?.setFilterValue(event.target.value)
                }
                className="mb-2 pl-8"
              />
            </div>
            <div className="space-y-2">
              {["Tesla", "LegalForce", "SpaceX"].map((owner) => (
                <div key={owner} className="flex items-center">
                  <Checkbox id={`owner-${owner.toLowerCase()}`} />
                  <label
                    htmlFor={`owner-${owner.toLowerCase()}`}
                    className="ml-2 text-sm font-medium"
                  >
                    {owner}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <h3 className="font-semibold mb-4">Display</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Grid View
              </Button>
              <Button variant="outline" size="sm">
                List View
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
