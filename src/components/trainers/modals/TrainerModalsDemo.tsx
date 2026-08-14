import React from "react";
import {
  AddTrainerModal,
  EditTrainerModal,
  DeleteTrainerModal,
  AssignClassesModal,
  ViewTrainerProfileModal,
  UpdateTrainerStatusModal,
  ExportTrainerDataModal,
  // The following are planned but not yet implemented:
  // RemoveTrainerModal,
  // RestoreTrainerModal,
  // TrainerActivityLogModal,
  // TrainerNotesModal,
  // TrainerPaymentsModal,
  // TrainerScheduleModal,
  // TrainerRequestsModal,
  // TrainerKPICardModal,
  // TrainerAnalyticsModal,
  // TrainerAutomationModal,
} from "./index";

const TrainerModalsDemo = () => {
  // State for each modal
  const [open, setOpen] = React.useState<string | null>(null);
  // Mock data for demonstration
  const mockTrainer = {
    id: "1",
    name: "Jane Doe",
    email: "jane@fit.com",
    phone: "+973 1234 5678",
    specialty: "Strength Training",
    rating: 4.7,
    status: "active" as const,
    classes: 12,
    experience: "5 years",
    avatar: "JD",
  };

  return (
    <div className="space-y-8 p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Trainer Modals Demo</h1>
      {/* AddTrainerModal */}
      <section>
        <button className="btn" onClick={() => setOpen("add")}>
          Open Add Trainer Modal
        </button>
        <AddTrainerModal
          isOpen={open === "add"}
          onClose={() => setOpen(null)}
        />
      </section>
      {/* EditTrainerModal */}
      <section>
        <button className="btn" onClick={() => setOpen("edit")}>
          Open Edit Trainer Modal
        </button>
        <EditTrainerModal
          isOpen={open === "edit"}
          onClose={() => setOpen(null)}
          trainer={mockTrainer}
        />
      </section>
      {/* DeleteTrainerModal */}
      <section>
        <button className="btn" onClick={() => setOpen("delete")}>
          Open Delete Trainer Modal
        </button>
        <DeleteTrainerModal
          isOpen={open === "delete"}
          onClose={() => setOpen(null)}
          trainer={mockTrainer}
        />
      </section>
      {/* AssignClassesModal */}
      <section>
        <button className="btn" onClick={() => setOpen("assign")}>
          Open Assign Classes Modal
        </button>
        <AssignClassesModal
          isOpen={open === "assign"}
          onClose={() => setOpen(null)}
          trainer={mockTrainer}
        />
      </section>
      {/* ViewTrainerProfileModal */}
      <section>
        <button className="btn" onClick={() => setOpen("profile")}>
          Open View Trainer Profile Modal
        </button>
        <ViewTrainerProfileModal
          isOpen={open === "profile"}
          onClose={() => setOpen(null)}
          trainer={mockTrainer}
        />
      </section>
      {/* UpdateTrainerStatusModal */}
      <section>
        <button className="btn" onClick={() => setOpen("status")}>
          Open Update Trainer Status Modal
        </button>
        <UpdateTrainerStatusModal
          open={open === "status"}
          onClose={() => setOpen(null)}
          trainerId={mockTrainer.id}
        />
      </section>
      {/* ExportTrainerDataModal */}
      <section>
        <button className="btn" onClick={() => setOpen("export")}>
          Open Export Trainer Data Modal
        </button>
        <ExportTrainerDataModal
          isOpen={open === "export"}
          onClose={() => setOpen(null)}
        />
      </section>
      {/* Placeholders for not-yet-implemented modals */}
      <section>
        <button className="btn btn-disabled" disabled>
          Remove Trainer Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Restore Trainer Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Trainer Activity Log Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Trainer Notes Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Trainer Payments Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Trainer Schedule Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Trainer Requests Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Trainer KPI Card Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Trainer Analytics Modal (Not yet implemented)
        </button>
      </section>
      <section>
        <button className="btn btn-disabled" disabled>
          Trainer Automation Modal (Not yet implemented)
        </button>
      </section>
    </div>
  );
};

export default TrainerModalsDemo;
