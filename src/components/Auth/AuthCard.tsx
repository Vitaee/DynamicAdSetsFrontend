/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../stores/auth';
import { useNavigate } from 'react-router-dom';
import { isEmail, minLen, nonEmpty } from '../../lib/validators';
import { toast } from '../../stores/ui';
import FormField from '../ui/FormField';

type Mode = 'register' | 'login';

export default function AuthCard({ initialMode = 'register' as Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accept, setAccept] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { register, login, status } = useAuth();
  const navigate = useNavigate();

  type Errors = { name?: string; email?: string; password?: string };
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<{ [k in keyof Errors]?: boolean }>({});

  function validate(currMode: Mode = mode): Errors {
    const e: Errors = {};
    if (currMode === 'register') {
      if (!nonEmpty(name)) e.name = 'Name is required';
    }
    if (!isEmail(email)) e.email = 'Enter a valid email';
    if (!minLen(password, 8)) e.password = 'Min 8 characters';
    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'register') {
        if (!accept) return setError('Please accept the terms to continue.');
        const v = validate('register');
        setErrors(v);
        if (Object.keys(v).length) return;
        await register({ name, companyName, email, password });
        toast.success('Welcome to WeatherTrigger!', 'Account created');
      } else {
        const v = validate('login');
        setErrors(v);
        if (Object.keys(v).length) return;
        await login({ email, password });
        toast.success('Welcome back!', 'Logged in');
      }
      navigate('/onboarding/connect-ads');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
      toast.error(err?.message || 'Please try again', 'Authentication failed');
    }
  }

  return (
    <div className="wt-card p-8 sm:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('register')}
            className={`text-lg font-semibold cursor-pointer transition-all duration-200 hover:scale-105 ${
              mode === 'register' 
                ? 'text-foreground opacity-100 transform scale-105' 
                : 'text-muted opacity-50 hover:opacity-75'
            }`}
          >
            Register
          </button>
          <span className="text-subtle opacity-60">/</span>
          <button
            onClick={() => setMode('login')}
            className={`text-lg font-semibold cursor-pointer transition-all duration-200 hover:scale-105 ${
              mode === 'login' 
                ? 'text-foreground opacity-100 transform scale-105' 
                : 'text-muted opacity-50 hover:opacity-75'
            }`}
          >
            Login
          </button>
        </div>
        <ThemeToggle />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === 'register' && (
          <FormField label="Full name" htmlFor="fullName" required error={touched.name ? errors.name : undefined}>
            <Input
              id="fullName"
              placeholder="Insert your full name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              onBlur={()=>setTouched((t)=>({...t, name: true}))}
              error={touched.name && errors.name ? errors.name : undefined}
            />
          </FormField>
        )}
        {mode === 'register' && (
          <FormField label="Company Name" htmlFor="companyName">
            <Input id="companyName" placeholder="Insert your company name" value={companyName} onChange={(e)=>setCompanyName(e.target.value)} />
          </FormField>
        )}

        <FormField label="Email Address" htmlFor="email" error={touched.email ? errors.email : undefined}>
          <Input
            id="email"
            type="email"
            placeholder="Insert your email address"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            onBlur={()=>setTouched((t)=>({...t, email: true}))}
            error={touched.email && errors.email ? errors.email : undefined}
          />
        </FormField>
        <FormField label="Password" htmlFor="password" hint="At least 8 characters" error={touched.password ? errors.password : undefined}>
          <Input
            id="password"
            type="password"
            placeholder="Insert your password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            onBlur={()=>setTouched((t)=>({...t, password: true}))}
            error={touched.password && errors.password ? errors.password : undefined}
          />
        </FormField>
        
        {mode === 'register' && (
          <div className="pt-2">
            <Checkbox id="terms" checked={accept} onChange={(e)=>setAccept(e.currentTarget.checked)} label={<span>I accept <a className="text-indigo-600 dark:text-indigo-400 hover:underline" href="#">terms and conditions</a></span>} />
          </div>
        )}
        
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={status==='loading'}>
          {status==='loading' ? 'Please wait…' : mode === 'register' ? 'CREATE MY ACCOUNT' : 'LOGIN'}
        </Button>
        <p className="text-center text-sm text-muted">
          {mode === 'register' ? (
            <>I already have an account? <button type="button" onClick={()=>setMode('login')} className="font-medium text-primary hover:underline cursor-pointer">Login</button></>
          ) : (
            <>New here? <button type="button" onClick={()=>setMode('register')} className="font-medium text-primary hover:underline cursor-pointer">Create an account</button></>
          )}
        </p>
      </form>
    </div>
  );
}
