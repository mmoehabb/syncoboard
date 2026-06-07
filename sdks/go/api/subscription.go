package api

import "time"

type SubscriptionService struct {
	client *Client
}

type Subscription struct {
	ID        string    `json:"id"`
	UserId    string    `json:"userId"`
	PlanId    string    `json:"planId"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type CheckoutPayload struct {
	PriceID string `json:"priceId"`
}

type CheckoutResponse struct {
	ApprovalURL string `json:"approvalUrl"`
}

func (s *SubscriptionService) SubscribeToFreePlan() (*Subscription, error) {
	var resp struct {
		Subscription Subscription `json:"subscription"`
	}
	err := s.client.doRequest("POST", "/subscriptions", nil, &resp)
	return &resp.Subscription, err
}

func (s *SubscriptionService) Checkout(priceID string) (*CheckoutResponse, error) {
	body := CheckoutPayload{PriceID: priceID}
	var resp CheckoutResponse
	err := s.client.doRequest("POST", "/subscriptions/checkout", body, &resp)
	return &resp, err
}
