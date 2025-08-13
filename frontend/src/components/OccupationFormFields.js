import React from 'react';
import { Form } from 'react-bootstrap';

const OccupationFormFields = ({ formData, setFormData, readOnly = false }) => (
  <>
    <div className="row">
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Division Title</Form.Label>
          <Form.Control
            type="text"
            value={formData.Division_Title}
            onChange={(e) => setFormData({ ...formData, Division_Title: e.target.value })}
            required
            readOnly={readOnly}
          />
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Sub Division Title</Form.Label>
          <Form.Control
            type="text"
            value={formData.Sub_Division_Title}
            onChange={(e) => setFormData({ ...formData, Sub_Division_Title: e.target.value })}
            required
            readOnly={readOnly}
          />
        </Form.Group>
      </div>
    </div>
    <div className="row">
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Group Title</Form.Label>
          <Form.Control
            type="text"
            value={formData.Group_Title}
            onChange={(e) => setFormData({ ...formData, Group_Title: e.target.value })}
            required
            readOnly={readOnly}
          />
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Family Title</Form.Label>
          <Form.Control
            type="text"
            value={formData.Family_Title}
            onChange={(e) => setFormData({ ...formData, Family_Title: e.target.value })}
            required
            readOnly={readOnly}
          />
        </Form.Group>
      </div>
    </div>
    <div className="row">
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>NCO 2004 Code</Form.Label>
          <Form.Control
            type="text"
            value={formData.NCO_2004_Code}
            onChange={(e) => setFormData({ ...formData, NCO_2004_Code: e.target.value })}
            required
            readOnly={readOnly}
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Code 2015</Form.Label>
          <Form.Control
            type="text"
            value={formData.Code}
            onChange={(e) => setFormData({ ...formData, Code: e.target.value })}
            required
            readOnly={readOnly}
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Job Title</Form.Label>
          <Form.Control
            type="text"
            value={formData.Title}
            onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
            required
            readOnly={readOnly}
          />
        </Form.Group>
      </div>
    </div>
  </>
);

export default OccupationFormFields;
