import { useState } from "react";
import { Field } from "formik";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";

export default function PasswordInput({ id, name, ...fieldProps }) {
  const [show, setShow] = useState(false);
  const label = show ? "Hide password" : "Show password";

  return (
    <div className="input-group">
      <Field
        id={id}
        name={name}
        type={show ? "text" : "password"}
        className="form-control"
        {...fieldProps}
      />
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={() => setShow((s) => !s)}
        aria-label={label}
        aria-pressed={show}
        title={label}
      >
        <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
      </button>
    </div>
  );
}