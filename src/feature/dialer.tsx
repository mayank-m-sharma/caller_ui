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
} from 'lucide-react';
import * as React from 'react';
import { cn } from '~/lib/utils';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Link } from 'react-router-dom';

interface Contact {
  id: string;
  name: string;
  number: string;
}

type DialerView = 'dialer' | 'contacts' | 'incoming' | 'incall' | 'history';
type CallStatus = 'incoming' | 'outgoing' | 'missed' | 'declined';

interface CallHistoryItem {
  number: string;
  timestamp: Date;
  status: CallStatus;
}

interface DialerProps {
  className?: string;
}
const AUTH_TOKEN = "VnZiU0l2Y3RyS2dITHVCVmdkZ3lNQT09OkEyMUMwNUFGM0JGMjQwREQ5OTU0QUQyMTVENzIyOEQ3";
let locationId:any = 'hqD2EpUwBJg1nEBWr4jT';
let ghlAuthToken = "";

export function Dialer({ className }: DialerProps) {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [selectedNumber, _setSelectedNumber] = React.useState('(470) 745-2321');
  const [currentView, setCurrentView] = React.useState<DialerView>('dialer');
  const [previousView, setPreviousView] = React.useState<
    'dialer' | 'contacts' | 'history'
  >('dialer');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [callDuration, setCallDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeaker, setIsSpeaker] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isCallConnected, setIsCallConnected] = React.useState(false);
  const [contacts, _setContacts] = React.useState<Array<Contact>>([]);
  const [lastCall, setLastCall] = React.useState<CallHistoryItem | null>(null);
  const [callHistory, setCallHistory] = React.useState<Array<CallHistoryItem>>(
    [],
  );
  const [page, setPage] = React.useState(1);
  const [totalContacts, setTotalContacts] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchLocation = async () => {
    try {
      const response = await fetch(`https://cors-anywhere.herokuapp.com/https://api.textgrid.com/2010-04-01/ghl/location/${locationId}.json`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };
  const fetchContacts = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://services.leadconnectorhq.com/contacts/search`, {
        headers: {
          'Authorization': `Bearer ${ghlAuthToken}`,
          "version": "2021-07-28",
          'Content-Type': 'application/json',
        }, 
        method: 'POST',
        body: JSON.stringify({
          "locationId": locationId,
          "query": search,
          "page": page,
          "pageLimit": 20
        })
      });
      const data = await response.json();
      
      setTotalContacts(data.total);
      setHasMore(data.contacts.length > 0);
      
      return data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return { contacts: [] };
    } finally {
      setIsLoading(false);
    }
  }

  const getContactNameOrNumber = (number: string) => {
    const contact = contacts.find((c) => c.number === number);
    return contact ? contact.name : number;
  };

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    locationId = localStorage.getItem('locID') || locationId;
    if (currentView === 'incall' && isCallConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    fetchLocation().then(data => {
      if (data?.ghlAuthToken) {
        ghlAuthToken = data.ghlAuthToken;
        fetchContacts().then(data => {
          const fetchedContacts = data.contacts.map((contact: any) => ({
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
  }, [currentView, isCallConnected]);

  const handleKeyPress = (key: string) => {
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
    setPhoneNumber('');
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.number.includes(searchQuery),
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initiateCall = (isIncoming = false, _isOutgoing = false) => {
    const newCall: CallHistoryItem = {
      number: phoneNumber || selectedNumber,
      timestamp: new Date(),
      status: isIncoming ? 'incoming' : 'outgoing',
    };
    setLastCall(newCall);
    setCallHistory((prev) => [newCall, ...prev.slice(0, 9)]);
    setCurrentView('incall');
    if (isIncoming) {
      setIsCallConnected(true);
      setCallDuration(0);
    } else {
      setIsConnecting(true);
      // Mock call connecting behavior for outgoing calls
      setTimeout(() => {
        setIsConnecting(false);
        setIsCallConnected(true);
        setCallDuration(0);
      }, 3000); // Simulate 3 seconds of connecting time
    }
  };

  const endCall = (status: CallStatus = 'outgoing') => {
    if (lastCall) {
      const updatedCall = { ...lastCall, status };
      setLastCall(updatedCall);
      setCallHistory((prev) => [updatedCall, ...prev.slice(1)]);
    }
    setCurrentView(previousView);
    setCallDuration(0);
    setIsConnecting(false);
    setIsCallConnected(false);
    setIsMuted(false);
    setIsSpeaker(false);
  };

  const loadMoreContacts = async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    const data = await fetchContacts(nextPage, searchQuery);
    
    _setContacts(prev => [
      ...prev,
      ...data.contacts.map((contact: any) => ({
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        number: contact.phone || "No phone number",
      }))
    ]);
    setPage(nextPage);
  };

  const renderView = () => {
    const viewContent = (() => {
      switch (currentView) {
        case 'dialer':
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
            />
            </>
          );
        case 'contacts':
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
        case 'incoming':
          return (
            <IncomingCallView
              phoneNumber={phoneNumber}
              getContactNameOrNumber={getContactNameOrNumber}
              endCall={endCall}
              initiateCall={initiateCall}
            />
          );
        case 'incall':
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
        case 'history':
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
        {(currentView === 'dialer' ||
          currentView === 'contacts' ||
          currentView === 'history') && (
          <div className='grid h-16 grid-cols-3 border-t'>
            <Button
              variant='ghost'
              className={cn(
                'flex h-full flex-col items-center justify-center rounded-none border-r',
                currentView === 'contacts' && 'bg-muted',
              )}
              onClick={() => {
                setCurrentView('contacts');
                setPreviousView('contacts');
              }}
            >
              <User className='mb-1 size-4' />
              <span className='text-xs'>CONTACTS</span>
            </Button>
            <Button
              variant='ghost'
              className={cn(
                'flex h-full flex-col items-center justify-center rounded-none border-r',
                currentView === 'dialer' && 'bg-muted',
              )}
              onClick={() => {
                setCurrentView('dialer');
                setPreviousView('dialer');
              }}
            >
              <Hash className='mb-1 size-4' />
              <span className='text-xs'>DIAL</span>
            </Button>
            <Button
              variant='ghost'
              className={cn(
                'flex h-full flex-col items-center justify-center rounded-none',
                currentView === 'history' && 'bg-muted',
              )}
              onClick={() => {
                setCurrentView('history');
                setPreviousView('history');
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
        'fixed right-[20px] top-[50px] z-[1000] flex h-[480px] w-[300px] flex-col rounded-lg border bg-background shadow-lg',
        className,
      )}
    >
      {/* Temporary button for incoming call view */}
      {currentView !== 'incoming' && (
        <Button
          variant='outline'
          size='sm'
          className='absolute left-[-40px] top-4'
          onClick={() => {
            setPreviousView(currentView === 'contacts' ? 'contacts' : 'dialer');
            setCurrentView('incoming');
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
}: {
  phoneNumber: string;
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
  handleKeyPress: (key: string) => void;
  clearNumber: () => void;
  lastCall: CallHistoryItem | null;
  getContactNameOrNumber: (number: string) => string;
  initiateCall: (isIncoming?: boolean, isOutgoing?: boolean) => void;
}) {
  return (
    <>
    <Link to="/about" className='text-blue-500'>Visit About</Link>
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
      <div className='mb-4 grid grid-cols-3 gap-2'>
        {[
          { num: '1' },
          { num: '2' },
          { num: '3' },
          { num: '4' },
          { num: '5' },
          { num: '6' },
          { num: '7' },
          { num: '8' },
          { num: '9' },
          { num: '*' },
          { num: '0' },
          { num: '#' },
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
              : 'No recent calls'}
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
  isLoading
}: {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredContacts: Array<Contact>;
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
  initiateCall: (isIncoming?: boolean, isOutgoing?: boolean) => void;
  loadMoreContacts: () => void;
  hasMore: boolean;
  isLoading: boolean;
}) {
  const observer = React.useRef<IntersectionObserver>();
  const lastContactRef = React.useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
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
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        {!hasMore && (
          <p className="text-center text-muted-foreground p-4">
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
}: {
  phoneNumber: string;
  getContactNameOrNumber: (number: string) => string;
  endCall: (status: CallStatus) => void;
  initiateCall: (isIncoming?: boolean, isOutgoing?: boolean) => void;
}) {
  return (
    <div className='flex h-full flex-col justify-center'>
      <h2 className='mb-4 text-2xl font-bold'>Incoming Call</h2>
      <p className='mb-8 text-xl'>
        {getContactNameOrNumber(phoneNumber || '(555) 123-4567')}
      </p>
      <div className='flex gap-4'>
        <Button
          variant='destructive'
          onClick={() => {
            endCall('declined');
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
}: {
  isConnecting: boolean;
  isCallConnected: boolean;
  phoneNumber: string;
  selectedNumber: string;
  getContactNameOrNumber: (number: string) => string;
  callDuration: number;
  formatTime: (seconds: number) => string;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isSpeaker: boolean;
  setIsSpeaker: React.Dispatch<React.SetStateAction<boolean>>;
  endCall: (status: CallStatus) => void;
}) {
  return (
    <div className='flex h-full flex-col justify-center'>
      <h2 className='mb-4 text-2xl font-bold'>
        {isConnecting ? 'Connecting...' : 'In Call'}
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
          endCall('outgoing');
        }}
      >
        {isConnecting ? 'Cancel' : 'End Call'}
      </Button>
    </div>
  );
}

function CallHistoryView({
  callHistory,
  contacts,
  initiateCall,
}: {
  callHistory: Array<CallHistoryItem>;
  contacts: Array<Contact>;
  initiateCall: (isIncoming?: boolean, isOutgoing?: boolean) => void;
}) {
  const getContactNameOrNumber = (number: string) => {
    const contact = contacts.find((c) => c.number === number);
    return contact ? contact.name : number;
  };

  const getCallIcon = (status: CallStatus) => {
    switch (status) {
      case 'incoming':
        return <PhoneIncoming className='size-4 text-green-500' />;
      case 'outgoing':
        return <PhoneOutgoing className='size-4 text-blue-500' />;
      case 'missed':
        return <PhoneMissed className='size-4 text-red-500' />;
      case 'declined':
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
