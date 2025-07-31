import React from 'react';
import './Card.css';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  hover = false,
  interactive = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'card';
  const variantClasses = `card--${variant}`;
  const paddingClasses = `card--padding-${padding}`;
  const shadowClasses = `card--shadow-${shadow}`;
  const stateClasses = [
    hover && 'card--hover',
    interactive && 'card--interactive',
    onClick && 'card--clickable'
  ].filter(Boolean).join(' ');

  const cardClasses = [
    baseClasses,
    variantClasses,
    paddingClasses,
    shadowClasses,
    stateClasses,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={cardClasses}
      onClick={handleClick}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// Card Header Component
export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card__header ${className}`} {...props}>
    {children}
  </div>
);

// Card Body Component
export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`card__body ${className}`} {...props}>
    {children}
  </div>
);

// Card Footer Component
export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card__footer ${className}`} {...props}>
    {children}
  </div>
);

// Card Title Component
export const CardTitle = ({ children, level = 3, className = '', ...props }) => {
  const TitleComponent = `h${level}`;
  return (
    <TitleComponent className={`card__title ${className}`} {...props}>
      {children}
    </TitleComponent>
  );
};

// Card Subtitle Component
export const CardSubtitle = ({ children, className = '', ...props }) => (
  <p className={`card__subtitle ${className}`} {...props}>
    {children}
  </p>
);

// Card Text Component
export const CardText = ({ children, className = '', ...props }) => (
  <p className={`card__text ${className}`} {...props}>
    {children}
  </p>
);

// Card Image Component
export const CardImage = ({ src, alt, className = '', ...props }) => (
  <div className={`card__image ${className}`}>
    <img src={src} alt={alt} {...props} />
  </div>
);

// Card Badge Component
export const CardBadge = ({ 
  children, 
  variant = 'primary', 
  position = 'top-right',
  className = '', 
  ...props 
}) => (
  <div className={`card__badge card__badge--${variant} card__badge--${position} ${className}`} {...props}>
    {children}
  </div>
);

// Stat Card Component for Dashboard
export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'primary',
  className = '',
  ...props
}) => (
  <Card variant="stat" hover interactive className={`stat-card stat-card--${color} ${className}`} {...props}>
    <div className="stat-card__content">
      <div className="stat-card__header">
        {icon && <div className="stat-card__icon">{icon}</div>}
        <div className="stat-card__info">
          <h3 className="stat-card__title">{title}</h3>
          {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
        </div>
      </div>
      
      <div className="stat-card__value">{value}</div>
      
      {trend && (
        <div className={`stat-card__trend stat-card__trend--${trend}`}>
          <span className="stat-card__trend-icon">
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </span>
          <span className="stat-card__trend-value">{trendValue}</span>
        </div>
      )}
    </div>
  </Card>
);

// Request Card Component
export const RequestCard = ({
  patientName,
  bloodGroup,
  component,
  urgency,
  unitsRequired,
  location,
  timeAgo,
  status,
  onRespond,
  className = '',
  ...props
}) => (
  <Card variant="request" className={`request-card ${className}`} {...props}>
    <CardHeader>
      <div className="request-card__header">
        <div className="request-card__patient">
          <CardTitle level={4}>{patientName}</CardTitle>
          <div className="request-card__blood-info">
            <span className={`blood-group blood-group--${bloodGroup?.replace('+', 'pos').replace('-', 'neg')}`}>
              {bloodGroup}
            </span>
            <span className="component">{component}</span>
          </div>
        </div>
        <CardBadge variant={urgency?.toLowerCase()} position="top-right">
          {urgency}
        </CardBadge>
      </div>
    </CardHeader>
    
    <CardBody>
      <div className="request-card__details">
        <div className="request-card__detail">
          <span className="label">Units Needed:</span>
          <span className="value">{unitsRequired}</span>
        </div>
        {location && (
          <div className="request-card__detail">
            <span className="label">Location:</span>
            <span className="value">{location}</span>
          </div>
        )}
        <div className="request-card__detail">
          <span className="label">Posted:</span>
          <span className="value">{timeAgo}</span>
        </div>
      </div>
    </CardBody>
    
    {onRespond && (
      <CardFooter>
        <div className="request-card__actions">
          <button 
            className="btn btn--success btn--sm"
            onClick={() => onRespond('accept')}
          >
            Accept
          </button>
          <button 
            className="btn btn--ghost btn--sm"
            onClick={() => onRespond('decline')}
          >
            Decline
          </button>
        </div>
      </CardFooter>
    )}
    
    {status && (
      <div className={`request-card__status request-card__status--${status?.toLowerCase().replace(' ', '-')}`}>
        {status}
      </div>
    )}
  </Card>
);

export default Card;