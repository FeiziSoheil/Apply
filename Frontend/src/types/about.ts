export type AboutStat = {
  id: string;
  label: string;
  value: number;
  suffix?: string;
};

export type AboutValue = {
  id: string;
  title: string;
  description: string;
};

export type AboutTimelineItem = {
  id: string;
  year: number;
  title: string;
  description: string;
};

export type AboutLicense = {
  id: string;
  title: string;
  description: string;
};

export type AboutGalleryImage = {
  id: string;
  src: string;
  alt: string;
  caption: string;
};
