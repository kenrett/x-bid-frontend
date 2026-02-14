import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { format, parseISO } from "date-fns";
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
    fireEvent.change(screen.getByLabelText(/Storefront/i), {
      target: { value: "marketplace" },
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
      storefront_key: "marketplace",
      current_price: 12.5,
    });
  });

  it("submits ISO strings for start/end", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "My Auction" },
    });

    const dateInputs = screen.getAllByLabelText("Date");
    const timeSelects = screen.getAllByLabelText("Time");

    fireEvent.change(dateInputs[0], { target: { value: "2026-02-02" } });
    fireEvent.change(timeSelects[0], { target: { value: "14:30" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-02-03" } });
    fireEvent.change(timeSelects[1], { target: { value: "15:30" } });

    const form = screen.getByText(/title \*/i).closest("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "My Auction",
        start_date: expect.stringMatching(/2026-02-02T14:30:00/),
        end_time: expect.stringMatching(/2026-02-03T15:30:00/),
      }),
    );
  });

  it("blocks submit when end is before start", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "My Auction" },
    });

    const dateInputs = screen.getAllByLabelText("Date");
    const timeSelects = screen.getAllByLabelText("Time");

    fireEvent.change(dateInputs[0], { target: { value: "2026-02-02" } });
    fireEvent.change(timeSelects[0], { target: { value: "14:30" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-02-02" } });
    fireEvent.change(timeSelects[1], { target: { value: "14:00" } });

    const form = screen.getByText(/title \*/i).closest("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    expect(screen.getByText("End must be after start")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("pre-fills initial values", () => {
    renderForm({
      initialValues: {
        title: "Initial",
        description: "Desc",
        image_url: "http://example.com",
        start_date: "2024-01-01T09:15:00-05:00",
        end_time: "2024-01-02T10:30:00-05:00",
        status: "scheduled",
        storefront_key: "afterdark",
        current_price: 5,
      },
    });

    expect(screen.getByDisplayValue("Initial")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Desc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("http://example.com")).toBeInTheDocument();
    const dateInputs = screen.getAllByLabelText("Date");
    const timeSelects = screen.getAllByLabelText("Time");
    expect(dateInputs[0]).toHaveValue("2024-01-01");
    expect(timeSelects[0]).toHaveValue(
      format(parseISO("2024-01-01T09:15:00-05:00"), "HH:mm"),
    );
    expect(dateInputs[1]).toHaveValue("2024-01-02");
    expect(timeSelects[1]).toHaveValue(
      format(parseISO("2024-01-02T10:30:00-05:00"), "HH:mm"),
    );
    expect(screen.getByDisplayValue("scheduled")).toBeInTheDocument();
    expect(screen.getByLabelText(/Storefront/i)).toHaveValue("afterdark");
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
  });

  it("submits with a relative upload path image URL from edit state", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({
      onSubmit,
      initialValues: {
        title: "Initial",
        image_url: "/api/v1/uploads/signed-id-123",
      },
    });

    const form = screen.getByText(/title \*/i).closest("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Initial",
      image_url: "/api/v1/uploads/signed-id-123",
    });
  });
});
