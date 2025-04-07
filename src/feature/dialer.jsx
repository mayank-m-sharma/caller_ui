import {
  Clock,
  Hash,
  Mic,
  MicOff,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Search,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import * as React from "react";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Link } from "react-router-dom";

// Import Bandwidth SDK (assuming you have it available)
import { BandwidthUA } from "../scripts/bw-webrtc-sdk.js";

const AUTH_TOKEN =
  "VnZiU0l2Y3RyS2dITHVCVmdkZ3lNQT09OkEyMUMwNUFGM0JGMjQwREQ5OTU0QUQyMTVENzIyOEQ3";
let locationId = "hqD2EpUwBJg1nEBWr4jT";
let ghlAuthToken = "";
let bandwidthAuthToken =
  "eyJraWQiOiJzZ25tLTE3OWU3Y2NkLTM0MzQtNGY5Yi05MjhlLWNkN2Y1ODEyNjNkNyIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJzZGtAdGV4dGdyaWQiLCJhdWQiOiJiYW5kd2lkdGguY29tIiwic2NwIjpbXSwiYWNjZXNzX3R5cGUiOiJBUEkiLCJyb2xlcyI6WyJ0ZXN0Um9sZSIsIkh0dHBWb2ljZSJdLCJpc3MiOiJodHRwczovL2lkLmJhbmR3aWR0aC5jb20vYXBpL3YxIiwiYWNjdF9zY29wZSI6IkFjY291bnQiLCJhY2NvdW50cyI6WyI1MDA4NDM3Il0sImV4cCI6MTc0Mzk2MTU4NCwiaWF0IjoxNzQzOTU3OTg0LCJqdGkiOiJhNkdDa2E5VmN0ZVU2ZTZYU3RKYzc2In0.TTaRHRROZt_iA3FRv4ce2c2WtWs_d-QTVOX2sit8tkbMB3INwCkssdUX_Dui0JW12l_K9H760hgTpXyRpgeLcV338TVvGXMCx35hYr2IHiuiQgbYLvDOdoLZ0OtVA7E-_DQM_0VBMzYfoCZyhs6cPm9S_A2PmH4fxyt4_KtO9FrbcOjxQtcJVOOa77XQUGZ0kYnWuxCdVIjm0OdZ6NBRZjiSqChAh-qsVJlpA3YxVJ4jVjjmKE2OZ54yFQvRraSzZ8TmHX72MUd5rxjJ-BZ3ARPG3yXvvqCcuZh7zu1dwbAH91g1nQp9zpDv18mJVVMzyUT_1GL_rtEcUFPNwQKyNw";
export function Dialer({ className }) {
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [selectedNumber, _setSelectedNumber] = React.useState("");
  const [currentView, setCurrentView] = React.useState("dialer");
  const [previousView, setPreviousView] = React.useState("dialer");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [callDuration, setCallDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeaker, setIsSpeaker] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isCallConnected, setIsCallConnected] = React.useState(false);
  const [contacts, _setContacts] = React.useState([]);
  const [lastCall, setLastCall] = React.useState(null);
  const [callHistory, setCallHistory] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  // Add Bandwidth SDK state
  const [bandwidthClient, setBandwidthClient] = React.useState(null);
  const [callSession, setCallSession] = React.useState(null);
  const [bandwidthNumber, setBandwidthNumber] = React.useState("+18452019469"); // Default Bandwidth number

  const initBandwidthClient = React.useCallback(() => {
    if (BandwidthUA && bandwidthAuthToken) {
      const bandwidthUA = new BandwidthUA();

      const serverConfig = {
        domain: "gw.webrtc-app.bandwidth.com",
        addresses: ["wss://gw.webrtc-app.bandwidth.com:10081"],
        iceServers: [
          // "stun.l.google.com:19302",
          // "stun1.l.google.com:19302",
          // "stun2.l.google.com:19302",
        ],
      };

      bandwidthUA.setServerConfig(
        serverConfig.addresses,
        serverConfig.domain,
        serverConfig.iceServers
      );

      bandwidthUA.checkAvailableDevices();
      bandwidthUA.setAccount(bandwidthNumber, "In-App Calling Sample", "");
      bandwidthUA.setOAuthToken(bandwidthAuthToken);

      bandwidthUA.setListeners({
        loginStateChanged: function (isLogin, cause) {
          console.log("Client state changed. Cause: " + cause);
          switch (cause) {
            case "connected":
              console.log("client>>> loginStateChanged: connected");
              break;
            case "disconnected":
              console.log("client>>> loginStateChanged: disconnected");
              if (bandwidthUA.isInitialized())
                console.log("Cannot connect to SBC server");
              break;
            case "login failed":
              console.log("client>>> loginStateChanged: login failed");
              break;
            case "login":
              console.log("client>>> loginStateChanged: login");
              break;
            case "logout":
              console.log("client>>> loginStateChanged: logout");
              break;
          }
        },
        outgoingCallProgress: function (call, response) {
          console.log("client>>> outgoing call progress");
          setIsConnecting(true);
        },
        callTerminated: function (call, message, cause) {
          console.log("client>>> call terminated callback");
          setIsConnecting(false);
          setIsCallConnected(false);
          setCallSession(null);
          endCall("outgoing");
        },
        callConfirmed: function (call, message, cause) {
          console.log("client>>> callConfirmed");
          setIsConnecting(false);
          setIsCallConnected(true);
          setCallDuration(0);
        },
        callShowStreams: function (call, localStream, remoteStream) {
          console.log("client>>> callShowStreams");
          const audio = new Audio();
          audio.srcObject = remoteStream;
          audio.play();
        },
        incomingCall: function (call, invite) {
          console.log("client>>> incomingCall");
          if (
            currentView === "dialer" ||
            currentView === "contacts" ||
            currentView === "history"
          ) {
            if (
              currentView === "dialer" ||
              currentView === "contacts" ||
              currentView === "history"
            ) {
              if (
                currentView === "dialer" ||
                currentView === "contacts" ||
                currentView === "history"
              ) {
                if (
                  currentView === "dialer" ||
                  currentView === "contacts" ||
                  currentView === "history"
                ) {
                  if (
                    currentView === "dialer" ||
                    currentView === "contacts" ||
                    currentView === "history"
                  ) {
                    setPreviousView(currentView);
                  }
                }
              }
            }
          }
          setCurrentView("incoming");
        },
        callHoldStateChanged: function (call, isHold, isRemote) {
          console.log("client>>> callHoldStateChanged");
        },
      });

      setBandwidthClient(bandwidthUA);
      return bandwidthUA;
    }
    return null;
  }, [bandwidthNumber, ghlAuthToken, currentView]);

  const fetchLocation = async () => {
    try {
      const response = await fetch(
        `https://cors-anywhere.herokuapp.com/https://api.textgrid.com/2010-04-01/ghl/location/${locationId}.json`,
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  const fetchContacts = async (page = 1, search = "") => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://services.leadconnectorhq.com/contacts/search`,
        {
          headers: {
            Authorization: `Bearer ${ghlAuthToken}`,
            version: "2021-07-28",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            locationId: locationId,
            query: search,
            page: page,
            pageLimit: 20,
          }),
        }
      );
      const data = await response.json();
      setHasMore(data.contacts.length > 0);
      return data;
    } catch (error) {
      console.error("Error fetching contacts:", error);
      return { contacts: [] };
    } finally {
      setIsLoading(false);
    }
  };

  const getContactNameOrNumber = (number) => {
    const contact = contacts.find((c) => c.number === number);
    return contact ? contact.name : number;
  };

  React.useEffect(() => {
    let timer;
    locationId = localStorage.getItem("locID") || locationId;

    // Timer for call duration
    if (currentView === "incall" && isCallConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    // Fetch location and contacts
    fetchLocation().then((data) => {
      if (data?.ghlAuthToken) {
        ghlAuthToken = data.ghlAuthToken;

        // Initialize Bandwidth client after getting auth token
        initBandwidthClient();

        fetchContacts().then((data) => {
          const fetchedContacts = data.contacts.map((contact) => ({
            id: contact.id,
            name: `${contact.firstNameLowerCase} ${contact.lastNameLowerCase}`,
            number: contact.phone || "No phone number",
          }));
          _setContacts(fetchedContacts);
        });
      }
    });

    return () => {
      clearInterval(timer);
    };
  }, [currentView, isCallConnected, initBandwidthClient]);

  const handleKeyPress = (key) => {
    if (phoneNumber.length < 14) {
      setPhoneNumber((prev) => {
        const newNumber = prev + key;
        if (newNumber.length === 3) return `(${newNumber}) `;
        if (newNumber.length === 9) return `${newNumber}-`;
        return newNumber;
      });
    }
  };

  const clearNumber = () => {
    setPhoneNumber("");
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.number.includes(searchQuery)
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Bandwidth call functions
  const makeBandwidthCall = (number, destinationNumber = "") => {
    if (!bandwidthClient) {
      console.error("Bandwidth client not initialized");
      return;
    }
    let extraHeaders = null;
    extraHeaders = [`User-to-User:${destinationNumber};encoding=text`];
    bandwidthClient
      .makeCall(number, extraHeaders)
      .then((value) => {
        setCallSession(value);
        console.log("Call created", value);
      })
      .catch((error) => {
        console.error("Call failed", error);
      });
  };

  const terminateCall = () => {
    if (callSession) {
      callSession.terminate();
    }
  };

  const initiateCall = (isIncoming = false, isOutgoing = false) => {
    const number = phoneNumber || selectedNumber;
    const newCall = {
      number: number,
      timestamp: new Date(),
      status: isIncoming ? "incoming" : "outgoing",
    };
    setLastCall(newCall);
    setCallHistory((prev) => [newCall, ...prev.slice(0, 9)]);
    setPreviousView(currentView);
    setCurrentView("incall");

    if (isIncoming) {
      setIsCallConnected(true);
      setCallDuration(0);
    } else if (isOutgoing) {
      setIsConnecting(true);
      makeBandwidthCall("18452019469", number.replace(/^[\+\s]+|[^0-9]/g, ""));
    }
  };

  const endCall = (status = "outgoing") => {
    // Terminate the Bandwidth call if active
    if (callSession) {
      terminateCall();
    }

    // Update call history
    if (lastCall) {
      const updatedCall = { ...lastCall, status };
      setLastCall(updatedCall);
      setCallHistory((prev) => [updatedCall, ...prev.slice(1)]);
    }

    // Reset UI state
    setCurrentView(previousView);
    setCallDuration(0);
    setIsConnecting(false);
    setIsCallConnected(false);
    setIsMuted(false);
    setIsSpeaker(false);
    setCallSession(null);
  };

  const loadMoreContacts = async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    const data = await fetchContacts(nextPage, searchQuery);

    _setContacts((prev) => [
      ...prev,
      ...data.contacts.map((contact) => ({
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        number: contact.phone || "No phone number",
      })),
    ]);
    setPage(nextPage);
  };

  const renderView = () => {
    const viewContent = (() => {
      switch (currentView) {
        case "dialer":
          return (
            <>
              <DialerView
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                handleKeyPress={handleKeyPress}
                clearNumber={clearNumber}
                lastCall={lastCall}
                getContactNameOrNumber={getContactNameOrNumber}
                initiateCall={initiateCall}
                bandwidthNumber={bandwidthNumber}
                setBandwidthNumber={setBandwidthNumber}
              />
            </>
          );
        case "contacts":
          return (
            <ContactsView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredContacts={filteredContacts}
              setPhoneNumber={setPhoneNumber}
              initiateCall={initiateCall}
              loadMoreContacts={loadMoreContacts}
              hasMore={hasMore}
              isLoading={isLoading}
            />
          );
        case "incoming":
          return (
            <IncomingCallView
              phoneNumber={phoneNumber}
              getContactNameOrNumber={getContactNameOrNumber}
              endCall={endCall}
              initiateCall={initiateCall}
            />
          );
        case "incall":
          return (
            <InCallView
              isConnecting={isConnecting}
              isCallConnected={isCallConnected}
              phoneNumber={phoneNumber}
              selectedNumber={selectedNumber}
              getContactNameOrNumber={getContactNameOrNumber}
              callDuration={callDuration}
              formatTime={formatTime}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              isSpeaker={isSpeaker}
              setIsSpeaker={setIsSpeaker}
              endCall={endCall}
            />
          );
        case "history":
          return (
            <CallHistoryView
              callHistory={callHistory}
              contacts={contacts}
              initiateCall={initiateCall}
            />
          );
      }
    })();

    return (
      <div className='flex h-full flex-col'>
        <div className='flex-1 overflow-y-auto p-4'>{viewContent}</div>
        {(currentView === "dialer" ||
          currentView === "contacts" ||
          currentView === "history") && (
          <div className='grid h-16 grid-cols-3 border-t'>
            <Button
              variant='ghost'
              className={cn(
                "flex h-full flex-col items-center justify-center rounded-none border-r",
                currentView === "contacts" && "bg-muted"
              )}
              onClick={() => {
                setCurrentView("contacts");
                setPreviousView("contacts");
              }}
            >
              <User className='mb-1 size-4' />
              <span className='text-xs'>CONTACTS</span>
            </Button>
            <Button
              variant='ghost'
              className={cn(
                "flex h-full flex-col items-center justify-center rounded-none border-r",
                currentView === "dialer" && "bg-muted"
              )}
              onClick={() => {
                setCurrentView("dialer");
                setPreviousView("dialer");
              }}
            >
              <Hash className='mb-1 size-4' />
              <span className='text-xs'>DIAL</span>
            </Button>
            <Button
              variant='ghost'
              className={cn(
                "flex h-full flex-col items-center justify-center rounded-none",
                currentView === "history" && "bg-muted"
              )}
              onClick={() => {
                setCurrentView("history");
                setPreviousView("history");
              }}
            >
              <Clock className='mb-1 size-4' />
              <span className='text-xs'>HISTORY</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "fixed right-[20px] top-[50px] z-[1000] flex h-[480px] w-[300px] flex-col rounded-lg border bg-background shadow-lg",
        className
      )}
    >
      {/* Temporary button for incoming call view */}
      {currentView !== "incoming" && (
        <Button
          variant='outline'
          size='sm'
          className='absolute left-[-40px] top-4'
          onClick={() => {
            setPreviousView(currentView === "contacts" ? "contacts" : "dialer");
            setCurrentView("incoming");
          }}
        >
          <PhoneIncoming className='size-4' />
        </Button>
      )}
      {renderView()}
    </div>
  );
}

function DialerView({
  phoneNumber,
  setPhoneNumber,
  handleKeyPress,
  clearNumber,
  lastCall,
  getContactNameOrNumber,
  initiateCall,
  bandwidthNumber,
  setBandwidthNumber,
}) {
  return (
    <>
      <Link to='/about' className='text-blue-500'>
        Visit About
      </Link>
      <div className='flex h-full flex-col justify-between'>
        <div className='relative mb-4'>
          <Input
            type='text'
            placeholder='Phone Number'
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
            }}
            className='pr-8'
          />
          {phoneNumber && (
            <Button
              variant='ghost'
              size='sm'
              className='absolute right-2 top-1/2 size-6 -translate-y-1/2 p-0'
              onClick={clearNumber}
            >
              <X className='size-4' />
            </Button>
          )}
        </div>
        <div className='mb-2'>
          <Input
            type='text'
            placeholder='Bandwidth Number'
            value={bandwidthNumber}
            onChange={(e) => {
              setBandwidthNumber(e.target.value);
            }}
            className='text-xs'
          />
          <div className='text-xs text-muted-foreground mt-1'>
            This is the number used to make calls from
          </div>
        </div>
        <div className='mb-4 grid grid-cols-3 gap-2'>
          {[
            { num: "1" },
            { num: "2" },
            { num: "3" },
            { num: "4" },
            { num: "5" },
            { num: "6" },
            { num: "7" },
            { num: "8" },
            { num: "9" },
            { num: "*" },
            { num: "0" },
            { num: "#" },
          ].map((key) => (
            <Button
              key={key.num}
              variant='ghost'
              className='flex h-14 items-center justify-center hover:bg-muted'
              onClick={() => {
                handleKeyPress(key.num);
              }}
            >
              <span className='text-lg font-medium'>{key.num}</span>
            </Button>
          ))}
        </div>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex flex-col items-start'>
            <span className='text-xs text-muted-foreground'>Last Call</span>
            <span className='text-sm'>
              {lastCall
                ? getContactNameOrNumber(lastCall.number)
                : "No recent calls"}
            </span>
          </div>
          <Button
            className='w-20 bg-emerald-500 hover:bg-emerald-600'
            onClick={() => {
              initiateCall(false, true);
            }}
          >
            <Phone className='size-4' />
          </Button>
        </div>
      </div>
    </>
  );
}

function ContactsView({
  searchQuery,
  setSearchQuery,
  filteredContacts,
  setPhoneNumber,
  initiateCall,
  loadMoreContacts,
  hasMore,
  isLoading,
}) {
  const observer = React.useRef();
  const lastContactRef = React.useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreContacts();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore]
  );

  return (
    <div className='flex h-full flex-col'>
      <div className='relative mb-4'>
        <Input
          type='text'
          placeholder='Search contacts'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pr-8'
        />
        <Search className='absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
      </div>
      <div className='flex-1 overflow-y-auto'>
        {filteredContacts.map((contact, index) => (
          <div
            ref={index === filteredContacts.length - 1 ? lastContactRef : null}
            key={contact.id}
            className='flex items-center justify-between border-b py-2'
          >
            <div>
              <p className='font-medium'>{contact.name}</p>
              <p className='text-sm text-muted-foreground'>{contact.number}</p>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setPhoneNumber(contact.number);
                initiateCall(false, true);
              }}
            >
              <Phone className='size-4' />
            </Button>
          </div>
        ))}
        {isLoading && (
          <div className='flex justify-center p-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
          </div>
        )}
        {!hasMore && (
          <p className='text-center text-muted-foreground p-4'>
            No more contacts to load
          </p>
        )}
      </div>
    </div>
  );
}

function IncomingCallView({
  phoneNumber,
  getContactNameOrNumber,
  endCall,
  initiateCall,
}) {
  return (
    <div className='flex h-full flex-col justify-center'>
      <h2 className='mb-4 text-2xl font-bold'>Incoming Call</h2>
      <p className='mb-8 text-xl'>
        {getContactNameOrNumber(phoneNumber || "(555) 123-4567")}
      </p>
      <div className='flex gap-4'>
        <Button
          variant='destructive'
          onClick={() => {
            endCall("declined");
          }}
        >
          Decline
        </Button>
        <Button
          variant='default'
          className='bg-yellow-500 hover:bg-yellow-600'
          // onClick={() => {}}
        >
          Silence
        </Button>
        <Button
          variant='default'
          className='bg-green-500 hover:bg-green-600'
          onClick={() => {
            initiateCall(true);
          }}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}

function InCallView({
  isConnecting,
  isCallConnected,
  phoneNumber,
  selectedNumber,
  getContactNameOrNumber,
  callDuration,
  formatTime,
  isMuted,
  setIsMuted,
  isSpeaker,
  setIsSpeaker,
  endCall,
}) {
  return (
    <div className='flex h-full flex-col justify-center'>
      <h2 className='mb-4 text-2xl font-bold'>
        {isConnecting ? "Connecting..." : "In Call"}
      </h2>
      <p className='mb-8 text-xl'>
        {getContactNameOrNumber(phoneNumber || selectedNumber)}
      </p>
      {isCallConnected && (
        <p className='mb-8 text-lg'>{formatTime(callDuration)}</p>
      )}
      <div className='mb-4 flex gap-4'>
        <Button
          variant='outline'
          onClick={() => {
            setIsMuted(!isMuted);
          }}
          disabled={!isCallConnected}
        >
          {isMuted ? <MicOff className='size-4' /> : <Mic className='size-4' />}
        </Button>
        <Button
          variant='outline'
          onClick={() => {
            setIsSpeaker(!isSpeaker);
          }}
          disabled={!isCallConnected}
        >
          {isSpeaker ? (
            <Volume2 className='size-4' />
          ) : (
            <VolumeX className='size-4' />
          )}
        </Button>
      </div>
      <Button
        variant='destructive'
        onClick={() => {
          endCall("outgoing");
        }}
      >
        {isConnecting ? "Cancel" : "End Call"}
      </Button>
    </div>
  );
}

function CallHistoryView({ callHistory, contacts, initiateCall }) {
  const getContactNameOrNumber = (number) => {
    const contact = contacts.find((c) => c.number === number);
    return contact ? contact.name : number;
  };

  const getCallIcon = (status) => {
    switch (status) {
      case "incoming":
        return <PhoneIncoming className='size-4 text-green-500' />;
      case "outgoing":
        return <PhoneOutgoing className='size-4 text-blue-500' />;
      case "missed":
        return <PhoneMissed className='size-4 text-red-500' />;
      case "declined":
        return <PhoneOff className='size-4 text-yellow-500' />;
    }
  };

  return (
    <div className='flex h-full flex-col'>
      <h2 className='mb-4 text-lg font-semibold'>Call History</h2>
      <div className='flex-1 overflow-y-auto'>
        {callHistory.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center text-center'>
            <Clock className='mb-4 size-12 text-muted-foreground' />
            <p className='text-muted-foreground'>No call history yet</p>
            <p className='text-sm text-muted-foreground'>
              Your recent calls will appear here
            </p>
          </div>
        ) : (
          callHistory.map((call, index) => (
            <div
              key={index}
              className='flex items-center justify-between border-b py-2'
            >
              <div className='flex items-center'>
                <div className='mr-3'>{getCallIcon(call.status)}</div>
                <div>
                  <p className='font-medium'>
                    {getContactNameOrNumber(call.number)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {call.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  initiateCall(false, true);
                }}
              >
                <Phone className='size-4' />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
