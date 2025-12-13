import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminBidPackForm } from "./AdminBidPackForm";

const renderForm = (
  props?: Partial<Parameters<typeof AdminBidPackForm>[0]>,
) => {
  const onSubmit = props?.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  return {
    onSubmit,
    ...render(
      <AdminBidPackForm submitLabel="Submit" onSubmit={onSubmit} {...props} />,
    ),
  };
};

describe("AdminBidPackForm", () => {
  it("requires name, bids, and price", async () => {
    const { onSubmit } = renderForm();
    const form = screen.getByText(/name \*/i).closest("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;

    fireEvent.submit(form);
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Starter" },
    });
    fireEvent.submit(form);
    expect(
      await screen.findByText("Bids must be a number."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Bids/i), {
      target: { value: "ten" },
    });
    fireEvent.change(screen.getByLabelText(/Price/i), {
      target: { value: "abc" },
    });
    fireEvent.submit(form);
    expect(
      await screen.findByText("Bids must be a number."),
    ).toBeInTheDocument();
  });

  it("submits trimmed numeric payload and price per bid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "  Premium  " },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "  Desc  " },
    });
    fireEvent.change(screen.getByLabelText(/Bids/i), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByLabelText(/Price/i), {
      target: { value: "40" },
    });
    fireEvent.click(screen.getByLabelText(/Highlight as featured/i));

    const form = screen.getByText(/name \*/i).closest("form");
    if (!form) throw new Error("Form not found");
    form.noValidate = true;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Premium",
      description: "Desc",
      bids: 200,
      price: 40,
      pricePerBid: "0.20",
      highlight: true,
    });
  });

  it("pre-fills initial values", () => {
    renderForm({
      initialValues: {
        name: "Initial",
        description: "Existing",
        bids: 50,
        price: 9.99,
        highlight: true,
      },
    });

    expect(screen.getByDisplayValue("Initial")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    expect(screen.getByDisplayValue("9.99")).toBeInTheDocument();
    expect(screen.getByLabelText(/Highlight as featured/i)).toBeChecked();
  });
});
