import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminAuctionForm } from "./AdminAuctionForm";

const renderForm = (
  props?: Partial<Parameters<typeof AdminAuctionForm>[0]>,
) => {
  const onSubmit = props?.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  return {
    onSubmit,
    ...render(
      <AdminAuctionForm submitLabel="Submit" onSubmit={onSubmit} {...props} />,
    ),
  };
};

describe("AdminAuctionForm", () => {
  it("blocks submit when title is empty and shows an error", async () => {
    const { onSubmit } = renderForm();

    const form = screen.getByText(/title \*/i).closest("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed payload with numeric price and status", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "  My Auction  " },
    });
    fireEvent.change(screen.getByLabelText(/Status/i), {
      target: { value: "active" },
    });
    fireEvent.change(screen.getByLabelText(/Current Price/i), {
      target: { value: "12.50" },
    });

    const form = screen.getByText(/title \*/i).closest("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      title: "My Auction",
      status: "active",
      current_price: 12.5,
    });
  });

  it("pre-fills initial values", () => {
    renderForm({
      initialValues: {
        title: "Initial",
        description: "Desc",
        image_url: "http://example.com",
        start_date: "2024-01-01",
        end_time: "2024-01-02",
        status: "scheduled",
        current_price: 5,
      },
    });

    expect(screen.getByDisplayValue("Initial")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Desc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("http://example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-01-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-01-02")).toBeInTheDocument();
    expect(screen.getByDisplayValue("scheduled")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
  });
});
