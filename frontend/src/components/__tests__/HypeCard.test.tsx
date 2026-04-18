import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HypeCard from "../HypeCard";
import type { Ticket } from "@/data/mockData";

const mockTicket: Ticket = {
  id: "TKT-001",
  matchTitle: "IPL 2024: The Finale",
  teamA: "Mumbai Indians",
  teamB: "Chennai Super Kings",
  venue: "Narendra Modi Stadium",
  date: "2024-05-26",
  time: "19:30 IST",
  section: "Premium Lounge",
  block: "B3",
  row: "12",
  seat: "18",
  tier: "Gold",
  userName: "Arjun Mehta",
  qrCode: "ARENAFLOW-TKT-2024-FINALE-001",
};

describe("HypeCard Component", () => {
  describe("renders correctly with Gold tier props", () => {
    it("should render with Gold tier label", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("LEGENDARY")).toBeInTheDocument();
    });

    it("should display match title", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("IPL 2024: The Finale")).toBeInTheDocument();
    });

    it("should display section information", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText(/Section: Premium Lounge/)).toBeInTheDocument();
    });

    it("should show Gold tier badge styling", () => {
      render(<HypeCard ticket={mockTicket} />);

      const badge = screen.getByText("LEGENDARY");
      expect(badge).toHaveClass("bg-yellow-500");
    });

    it("should render seat info on back", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("B3")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("18")).toBeInTheDocument();
    });
  });

  describe("renders correctly with Standard tier props", () => {
    const standardTicket: Ticket = {
      ...mockTicket,
      tier: "Standard",
      section: "General Admission",
      block: "A1",
      row: "5",
      seat: "42",
    };

    it("should render with Standard tier label", () => {
      render(<HypeCard ticket={standardTicket} />);

      expect(screen.getByText("STANDARD")).toBeInTheDocument();
    });

    it("should display Standard section information", () => {
      render(<HypeCard ticket={standardTicket} />);

      expect(screen.getByText(/Section: General Admission/)).toBeInTheDocument();
    });

    it("should show Standard tier badge styling", () => {
      render(<HypeCard ticket={standardTicket} />);

      const badge = screen.getByText("STANDARD");
      expect(badge).toBeInTheDocument();
    });

    it("should render with Standard seat info", () => {
      render(<HypeCard ticket={standardTicket} />);

      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should use fallback data when no ticket prop provided", () => {
      render(<HypeCard />);

      expect(screen.getByText("IPL 2024: The Finale")).toBeInTheDocument();
    });
  });

  describe("renders correctly with Silver tier props", () => {
    const silverTicket: Ticket = {
      ...mockTicket,
      tier: "Silver",
      section: "Club Level",
    };

    it("should render with Silver tier label", () => {
      render(<HypeCard ticket={silverTicket} />);

      expect(screen.getByText("PREMIUM")).toBeInTheDocument();
    });

    it("should display Silver section information", () => {
      render(<HypeCard ticket={silverTicket} />);

      expect(screen.getByText(/Section: Club Level/)).toBeInTheDocument();
    });
  });

  describe("flip animation triggers on tap", () => {
    it("should flip card when clicked", () => {
      render(<HypeCard ticket={mockTicket} />);

      const card = screen.getByText("IPL 2024: The Finale").closest(".relative");
      expect(card).toBeInTheDocument();

      if (card) {
        fireEvent.click(card);
      }

      expect(document.querySelector("[style*='rotateY']")).toBeTruthy();
    });

    it("should show QR code after flip", () => {
      render(<HypeCard ticket={mockTicket} />);

      const qrCode = screen.getByTestId("qrcode-svg");
      expect(qrCode).toBeInTheDocument();
    });

    it("should display ticket number on back", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("#LE-001")).toBeInTheDocument();
    });

    it("should have tap instruction on front", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText(/Tap to flip/)).toBeInTheDocument();
    });
  });

  describe("QR value displays correctly", () => {
    it("should render QR code with correct value", () => {
      render(<HypeCard ticket={mockTicket} />);

      const qrCode = screen.getByTestId("qrcode-svg");
      expect(qrCode).toHaveAttribute(
        "data-value",
        "ARENAFLOW-TKT-2024-FINALE-001"
      );
    });

    it("should show last 6 characters of QR code", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("#LE-001")).toBeInTheDocument();
    });

    it("should display SCAN AT GATE text", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("SCAN AT GATE")).toBeInTheDocument();
    });

    it("should render different QR for different tickets", () => {
      const ticket1: Ticket = { ...mockTicket, qrCode: "TICKET-001-ABC" };
      const ticket2: Ticket = { ...mockTicket, qrCode: "TICKET-002-XYZ" };

      const { rerender } = render(<HypeCard ticket={ticket1} />);

      let qrCode = screen.getByTestId("qrcode-svg");
      expect(qrCode).toHaveAttribute("data-value", "TICKET-001-ABC");

      rerender(<HypeCard ticket={ticket2} />);

      qrCode = screen.getByTestId("qrcode-svg");
      expect(qrCode).toHaveAttribute("data-value", "TICKET-002-XYZ");
    });
  });

  describe("action buttons on back", () => {
    it("should render Navigate button", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("Gate Navigation Options")).toBeInTheDocument();
    });

    it("should render Order Food button", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("Order Food")).toBeInTheDocument();
    });

    it("should render View Group Passes button", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("View Group Passes")).toBeInTheDocument();
    });

    it("should not trigger flip when clicking action buttons", () => {
      render(<HypeCard ticket={mockTicket} />);

      const foodButton = screen.getByText("Order Food");
      fireEvent.click(foodButton);
      expect(foodButton).toBeInTheDocument();
    });
  });

  describe("seat information display", () => {
    it("should display BLOCK label", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("BLOCK")).toBeInTheDocument();
    });

    it("should display ROW label", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("ROW")).toBeInTheDocument();
    });

    it("should display SEAT label", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("SEAT")).toBeInTheDocument();
    });

    it("should show correct block, row, seat values", () => {
      const customTicket: Ticket = {
        ...mockTicket,
        block: "C5",
        row: "25",
        seat: "100",
      };

      render(<HypeCard ticket={customTicket} />);

      expect(screen.getByText("C5")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });

  describe("Entry Pass header on back", () => {
    it("should display Entry Pass header", () => {
      render(<HypeCard ticket={mockTicket} />);

      expect(screen.getByText("Entry Pass")).toBeInTheDocument();
    });

    it("should display Sparkles icon", () => {
      render(<HypeCard ticket={mockTicket} />);

      const sparklesIcon = document.querySelector("svg");
      expect(sparklesIcon).toBeInTheDocument();
    });
  });
});
