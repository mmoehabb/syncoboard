package api

type BugService struct {
	client *Client
}

type BugReportPayload struct {
	Message string `json:"message"`
	Browser string `json:"browser"`
}

type BugReportResponse struct {
	ID        string `json:"id"`
	Message   string `json:"message"`
	Browser   string `json:"browser"`
	CreatedAt string `json:"createdAt"`
}

func (s *BugService) ReportBug(payload BugReportPayload) (*BugReportResponse, error) {
	var resp BugReportResponse
	err := s.client.doRequest("POST", "/bugs", payload, &resp)
	return &resp, err
}
