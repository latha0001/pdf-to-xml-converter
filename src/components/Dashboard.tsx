import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileUp, LogOut, Download, Copy, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '@supabase/supabase-js';
import xmlFormatter from 'xml-formatter';

interface DashboardProps {
  user: User;
}

interface Conversion {
  id: string;
  created_at: string;
  filename: string;
  xml_content: string;
}

export default function Dashboard({ user }: DashboardProps) {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConversions();
  }, []);

  const fetchConversions = async () => {
    const { data, error } = await supabase
      .from('conversions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching conversions');
    } else {
      setConversions(data || []);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, we would use a proper PDF parsing library
      // and handle the conversion server-side. For this demo, we'll create
      // a simple XML structure.
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <metadata>
    <filename>${file.name}</filename>
    <uploadedBy>${user.email}</uploadedBy>
    <timestamp>${new Date().toISOString()}</timestamp>
  </metadata>
  <content>
    <text>Sample converted content from ${file.name}</text>
  </content>
</document>`;

      const { error } = await supabase.from('conversions').insert({
        user_id: user.id,
        filename: file.name,
        xml_content: xmlContent,
      });

      if (error) throw error;

      toast.success('File converted successfully!');
      fetchConversions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyXML = (xml: string) => {
    navigator.clipboard.writeText(xml);
    toast.success('XML copied to clipboard');
  };

  const handleDownloadXML = (xml: string, filename: string) => {
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.pdf', '.xml');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversions')
        .delete()
        .match({ id });

      if (error) throw error;

      setConversions(conversions.filter((conv) => conv.id !== id));
      toast.success('Conversion deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">PDF to XML Converter</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-center w-full">
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg shadow-lg tracking-wide border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
              <FileUp className="w-8 h-8" />
              <span className="mt-2 text-base">{loading ? 'Converting...' : 'Select PDF file'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Conversion History
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {conversions.map((conversion) => (
                <li key={conversion.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">{conversion.filename}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(conversion.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCopyXML(conversion.xml_content)}
                        className="p-2 text-gray-600 hover:text-gray-900"
                        title="Copy XML"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownloadXML(conversion.xml_content, conversion.filename)}
                        className="p-2 text-gray-600 hover:text-gray-900"
                        title="Download XML"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(conversion.id)}
                        className="p-2 text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto text-sm">
                    {xmlFormatter(conversion.xml_content, {
                      indentation: '  ',
                      collapseContent: true,
                    })}
                  </pre>
                </li>
              ))}
              {conversions.length === 0 && (
                <li className="px-4 py-8 text-center text-gray-500">
                  No conversions yet. Upload a PDF to get started!
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}