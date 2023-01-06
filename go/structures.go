package main

type Config struct {
  BaseURL                         string `json:"baseUrl,omitempty"`
  LoginData struct {
    Email                         string `json:"email,omitempty"`
    Password                      string `json:"password,omitempty"`
  }                                      `json:"loginData,omitempty"`
}
type Credential struct {
  accessToken string
  client string
  uid string
}
type LogoutResponse struct {
  Success bool
}
type F5498Statement struct {
  UploaderId              string
  RecipientFirstName      string
  RecipientLastName       string
  RecipientTin            string
  RecipientTinType        string
  RecipientAddress1       string
  RecipientAddress2       string
  RecipientCity           string
  RecipientState          string
  RecipientZipCode        string
  SenderName              string
  SenderTin               string
  SenderAddress1          string
  SenderCity              string
  SenderState             string
  SenderZipCode           string
  LateContributionCode    string
  LateContributionYear       int
  Ira                       bool
  Roth                      bool
}
type F5498Correction struct {
  UploaderId string
  Statement F5498StatementCorrection
}
type F5498StatementCorrection struct {
  SenderCity             string
  SenderZipCode          string
  LateContributionCode   string
  LateContributionYear   int
  Roth                   bool

}
type AddResponse struct {
  Data struct {
    AddF5498Statements struct {
      Errors                    []string `json:"errors"`
      Statements []struct {
        RecordNumber                 int `json:"recordNumber"`
        Statement struct {
          UploaderId              string `json:"uploaderId,omitempty"`
          RecipientFirstName      string `json:"recipientFirstName,omitempty"`
          RecipientLastName       string `json:"recipientLastName,omitempty"`
          RecipientTin            string `json:"recipientTin,omitempty"`
          RecipientTinType        string `json:"recipientTinType,omitempty"`
          RecipientAddress1       string `json:"recipientAddress1,omitempty"`
          RecipientAddress2       string `json:"recipientAddress2,omitempty"`
          RecipientCity           string `json:"recipientCity,omitempty"`
          RecipientState          string `json:"recipientState,omitempty"`
          RecipientZipCode        string `json:"recipientZipCode,omitempty"`
          SenderName              string `json:"senderName,omitempty"`
          SenderTin               string `json:"senderTin,omitempty"`
          SenderAddress1          string `json:"senderAddress1,omitempty"`
          SenderCity              string `json:"senderCity,omitempty"`
          SenderState             string `json:"senderState,omitempty"`
          SenderZipCode           string `json:"senderZipCode,omitempty"`
          LateContributionCode    string `json:"lateContributionCode,omitempty"`
          LateContributionYear       int `json:"lateContributionYear,omitempty"`
          Ira                       bool `json:"ira,omitempty"`
          Roth                      bool `json:"roth,omitempty"`
        }                                `json:"statement"`
        Messages []               string `json:"messages"`
      }                                  `json:"statements"`
    }                                    `json:"addF5498Statements"`
  }                                      `json:"data"`
}
type CheckResponse struct {
  Data struct {
    GetF5498Statements struct {
      Errors                    []string `json:"errors"`
      Statements struct {
        PageInfo struct {
          HasNextPage               bool `json:"hasNextPage"`
        }                                `json:"pageInfo"`
        Nodes []struct {
          OtxId                   string `json:"otxId,omitempty"`
          UploaderId              string `json:"uploaderId,omitempty"`
          StatementValid            bool `json:"statementValid,omitempty"`
          ValidationMessages    []string `json:"validationMessages,omitempty"`
          Status                     int `json:"status,omitempty"`
          StatusDescription       string `json:"statusDescription,omitempty"`
          RecipientFirstName      string `json:"recipientFirstName,omitempty"`
          RecipientLastName       string `json:"recipientLastName,omitempty"`
          RecipientTin            string `json:"recipientTin,omitempty"`
          RecipientTinType        string `json:"recipientTinType,omitempty"`
          RecipientAddress1       string `json:"recipientAddress1,omitempty"`
          RecipientAddress2       string `json:"recipientAddress2,omitempty"`
          RecipientCity           string `json:"recipientCity,omitempty"`
          RecipientState          string `json:"recipientState,omitempty"`
          RecipientZipCode        string `json:"recipientZipCode,omitempty"`
          SenderName              string `json:"senderName,omitempty"`
          SenderTin               string `json:"senderTin,omitempty"`
          SenderAddress1          string `json:"senderAddress1,omitempty"`
          SenderCity              string `json:"senderCity,omitempty"`
          SenderState             string `json:"senderState,omitempty"`
          SenderZipCode           string `json:"senderZipCode,omitempty"`
          LateContributionCode    string `json:"lateContributionCode,omitempty"`
          LateContributionYear       int `json:"lateContributionYear,omitempty"`
          Ira                       bool `json:"ira,omitempty"`
          Roth                      bool `json:"roth,omitempty"`
        }                                `json:"nodes"`
      }                                  `json:"statements"`
    }                                    `json:"getF5498Statements"`
  }                                      `json:"data"`
}
type CorrectResponse struct {
  Data struct {
    UpdateF5498Statements struct {
      Statements []struct {
        RecordNumber                int  `json:"recordNumber,omitempty"`
        Statement struct {
          UploaderId              string `json:"uploaderId,omitempty"`
          SenderCity              string `json:"senderCity,omitempty"`
          SenderZipCode           string `json:"senderZipCode,omitempty"`
          LateContributionCode    string `json:"lateContributionCode,omitempty"`
          LateContributionYear       int `json:"lateContributionYear,omitempty"`
          Roth                      bool `json:"roth,omitempty"`
        }                                `json:"statement,omitempty"`
      }                                  `json:"statements,omitempty"`
    }                                    `json:"updateF5498Statements,omitempty"`
  }                                      `json:"data,omitempty"`
}



// This is incorrect.  See java code and make correction before
// releasing to production.
type FinalizeResponse struct {
  Data struct {
    FinalizeStatements struct {
      Errors                    []string `json:"errors"`
      Messages                  []string `json:"messages"`
      SuccessCount                   int `json:"successCount"`
    }                                    `json:"finalizeStatements,omitempty"`
  }                                      `json:"data,omitempty"`
}
type DeleteResponse struct {
  Data struct {
    DeleteStatements struct {
      Errors                    []string `json:"errors"`
      DeleteCount                    int `json:"deleteCount"`
    }                                    `json:"deleteStatements,omitempty"`
  }                                      `json:"data,omitempty"`
}
type DownloadResponse struct {
  Data struct {
    GetStatements struct {
      Errors                    []string `json:"errors"`
      Statements struct {
        Nodes []struct {
          UploaderId              string `json:"uploaderId,omitempty"`
          Pdf                     string `json:"pdf,omitempty"`
        }                                `json:"nodes"`
      }                                  `json:"statements"`
    }                                    `json:"getStatements"`
  }                                      `json:"data,omitempty"`
}
type SubmitResponse struct {
  Data struct {
    SubmitStatements struct {
      Messages []struct {
        Messages                []string `json:"messages"`
        UploaderId                string `json:"uploaderId"`
      }                                  `json:"messages"`
      Errors                    []string `json:"errors"`
      SuccessCount                   int `json:"successCount"`
    }                                    `json:"submitStatements,omitempty"`
  }                                      `json:"data,omitempty"`
}
type ConfirmRegistrationResponse struct {
  Data struct {
    ConfirmRegistration struct {
      Message                     string `json:"message"`
    }                                    `json:"confirmRegistration"`
  }                                      `json:"data"`
}
